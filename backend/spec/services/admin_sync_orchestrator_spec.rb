require "rails_helper"

RSpec.describe AdminSyncOrchestrator do
  let(:league) { create(:league) }
  let(:team) { create(:team, league: league, name: "Test Team") }

  def sync_run_for(kind, team: nil, league: nil)
    create(:sync_run, team: team, league: league, sync_kinds: [ kind ])
  end

  it "resolves one item per team, runs it, and finishes at total_steps" do
    run = sync_run_for(SyncRun::SYNC_KINDS[:team_roster], team: team)
    allow(SyncTeamRoster).to receive(:new).and_return(instance_double(SyncTeamRoster, call: []))

    described_class.new(sync_run: run).call

    run.reload
    expect(run.total_steps).to eq(1)
    expect(run.current_step).to eq(1)
    expect(run.current_step_label).to eq("team roster — Test Team")
    expect(run.status).to eq(SyncRun::STATUSES[:completed])
  end

  it "increments current_step atomically even if it changed underneath it mid-item" do
    run = sync_run_for(SyncRun::SYNC_KINDS[:standings], league: league)
    service_double = instance_double(SyncStandings)
    allow(SyncStandings).to receive(:new).and_return(service_double)
    # Simulates a second process bumping current_step while this "slow" sync runs —
    # a stale read-modify-write would silently drop this update.
    allow(service_double).to receive(:call) do
      SyncRun.where(id: run.id).update_all("current_step = current_step + 3")
    end

    described_class.new(sync_run: run).call

    expect(run.reload.current_step).to eq(4)
  end

  it "captures a failing item's error and keeps running the rest" do
    create(:team, league: league, name: "Team A")
    create(:team, league: league, name: "Team B")
    run = sync_run_for(SyncRun::SYNC_KINDS[:team_roster], league: league)
    calls = 0
    allow(SyncTeamRoster).to receive(:new) do |**|
      calls += 1
      double = instance_double(SyncTeamRoster)
      if calls == 1
        allow(double).to receive(:call).and_raise("boom")
      else
        allow(double).to receive(:call).and_return([])
      end
      double
    end

    described_class.new(sync_run: run).call

    run.reload
    expect(run.current_step).to eq(2)
    expect(run.sync_run_items.where(status: SyncRun::STATUSES[:failed]).count).to eq(1)
    expect(run.sync_run_items.where(status: SyncRun::STATUSES[:completed]).count).to eq(1)
    expect(run.sync_run_items.find_by(status: SyncRun::STATUSES[:failed]).error_message).to eq("boom")
    expect(run.status).to eq(SyncRun::STATUSES[:failed])
  end

  it "counts total_steps and current_step by real games for a game_stats item, not by the one item" do
    season = create(:season, league: league)
    games = Array.new(3) do |n|
      create(:game, season: season, home_team: team, away_team: create(:team, league: league),
             starts_at: Time.utc(2025, 10, 8 + n))
    end
    run = create(:sync_run, team: team, season: season, sync_kinds: [ SyncRun::SYNC_KINDS[:game_stats] ])
    allow(SyncGameStats).to receive(:new).and_return(instance_double(SyncGameStats, call: []))

    described_class.new(sync_run: run).call

    run.reload
    expect(run.total_steps).to eq(games.size)
    expect(run.current_step).to eq(games.size)
    expect(run.current_step_label).to eq("game stats — #{games.last.away_team.abbreviation} @ #{team.abbreviation} (3/3)")
    expect(run.sync_run_items.count).to eq(1)
    expect(run.sync_run_items.first.status).to eq(SyncRun::STATUSES[:completed])
  end

  it "syncs a whole-league game_stats run as one item over the season, not one item per team" do
    season = create(:season, league: league)
    team_a = create(:team, league: league, name: "Team A")
    team_b = create(:team, league: league, name: "Team B")
    shared_game = create(:game, season: season, home_team: team_a, away_team: team_b,
                        starts_at: Time.utc(2025, 10, 8))
    run = create(:sync_run, league: league, season: season, sync_kinds: [ SyncRun::SYNC_KINDS[:game_stats] ])
    synced_games = []
    allow(SyncGameStats).to receive(:new) do |game:, **|
      synced_games << game
      instance_double(SyncGameStats, call: [])
    end

    described_class.new(sync_run: run).call

    run.reload
    expect(run.sync_run_items.count).to eq(1)
    expect(run.sync_run_items.first.team_id).to be_nil
    expect(synced_games).to eq([ shared_game ])
    expect(run.total_steps).to eq(1)
  end

  it "ingests real events/shifts and recomputes for an advanced_stats item" do
    season = create(:season, league: league)
    games = Array.new(2) do |n|
      create(:game, season: season, home_team: team, away_team: create(:team, league: league),
             starts_at: Time.utc(2025, 10, 8 + n))
    end
    run = create(:sync_run, team: team, season: season, sync_kinds: [ SyncRun::SYNC_KINDS[:advanced_stats] ])
    recomputed_games = []
    allow(SyncGameEvents).to receive(:new) do |game:, **|
      recomputed_games << game
      instance_double(SyncGameEvents, call: [])
    end

    described_class.new(sync_run: run).call

    run.reload
    expect(recomputed_games).to match_array(games)
    expect(run.total_steps).to eq(games.size)
    expect(run.status).to eq(SyncRun::STATUSES[:completed])
  end

  it "syncs a whole-league advanced_stats run as one item over the season, not one item per team" do
    season = create(:season, league: league)
    team_a = create(:team, league: league, name: "Team A")
    team_b = create(:team, league: league, name: "Team B")
    shared_game = create(:game, season: season, home_team: team_a, away_team: team_b,
                        starts_at: Time.utc(2025, 10, 8))
    run = create(:sync_run, league: league, season: season, sync_kinds: [ SyncRun::SYNC_KINDS[:advanced_stats] ])
    recomputed_games = []
    allow(SyncGameEvents).to receive(:new) do |game:, **|
      recomputed_games << game
      instance_double(SyncGameEvents, call: [])
    end

    described_class.new(sync_run: run).call

    run.reload
    expect(run.sync_run_items.count).to eq(1)
    expect(run.sync_run_items.first.team_id).to be_nil
    expect(recomputed_games).to eq([ shared_game ])
    expect(run.total_steps).to eq(1)
  end

  it "checks for cancellation between games within a single game_stats item" do
    season = create(:season, league: league)
    create(:game, season: season, home_team: team, away_team: create(:team, league: league),
           starts_at: Time.utc(2025, 10, 8))
    create(:game, season: season, home_team: team, away_team: create(:team, league: league),
           starts_at: Time.utc(2025, 10, 9))
    run = create(:sync_run, team: team, season: season, sync_kinds: [ SyncRun::SYNC_KINDS[:game_stats] ])
    calls = 0
    allow(SyncGameStats).to receive(:new) do |**|
      calls += 1
      run.update!(status: SyncRun::STATUSES[:cancelled]) if calls == 1
      instance_double(SyncGameStats, call: [])
    end

    described_class.new(sync_run: run).call

    expect(calls).to eq(1)
    run.reload
    expect(run.current_step).to eq(1)
    expect(run.sync_run_items.first.status).to eq(SyncRun::STATUSES[:cancelled])
    expect(run.status).to eq(SyncRun::STATUSES[:cancelled])
  end

  # Regression guard for TASK-90: one flaky game shouldn't look identical to every
  # game failing — every failed game gets recorded, not just the last one.
  it "keeps going past a failed game and records every failure, not just the last" do
    season = create(:season, league: league)
    games = Array.new(3) do |n|
      create(:game, season: season, home_team: team, away_team: create(:team, league: league),
             starts_at: Time.utc(2025, 10, 8 + n))
    end
    run = create(:sync_run, team: team, season: season, sync_kinds: [ SyncRun::SYNC_KINDS[:game_stats] ])
    allow(SyncGameStats).to receive(:new) do |game:, **|
      if game == games[0]
        instance_double(SyncGameStats, call: []).tap { |d| allow(d).to receive(:call).and_raise("network blip") }
      elsif game == games[2]
        instance_double(SyncGameStats, call: []).tap { |d| allow(d).to receive(:call).and_raise("boom") }
      else
        instance_double(SyncGameStats, call: [])
      end
    end

    described_class.new(sync_run: run).call

    run.reload
    item = run.sync_run_items.first
    expect(item.status).to eq(SyncRun::STATUSES[:failed])
    expect(item.failed_games.size).to eq(2)
    expect(item.failed_games.map { |g| g["error"] }).to contain_exactly("network blip", "boom")
    expect(run.current_step).to eq(3) # all 3 games still processed, not aborted after the first failure
  end

  it "stops before its next item once the run is cancelled mid-loop" do
    create(:team, league: league, name: "Team A")
    create(:team, league: league, name: "Team B")
    run = sync_run_for(SyncRun::SYNC_KINDS[:team_roster], league: league)
    calls = 0
    allow(SyncTeamRoster).to receive(:new) do |**|
      calls += 1
      run.update!(status: SyncRun::STATUSES[:cancelled]) if calls == 1
      instance_double(SyncTeamRoster, call: [])
    end

    described_class.new(sync_run: run).call

    expect(calls).to eq(1)
    expect(run.reload.current_step).to eq(1)
    expect(run.sync_run_items.where(status: SyncRun::STATUSES[:queued]).count).to eq(1)
    expect(run.status).to eq(SyncRun::STATUSES[:cancelled])
  end
end
