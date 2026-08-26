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
