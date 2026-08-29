require "rails_helper"

RSpec.describe SyncGameEvents do
  let(:season) { create(:season) }
  # Fixture ids: home (SJS) = 28, away (CBJ) = 29.
  let(:home_team) { create(:team, league: season.league, nhl_team_id: 28) }
  let(:away_team) { create(:team, league: season.league, nhl_team_id: 29) }
  let(:game) { create(:game, season: season, home_team: home_team, away_team: away_team, nhl_game_id: 2024020204) }
  let(:pbp_payload) { JSON.parse(nhl_fixture("play_by_play")) }
  let(:shift_payload) { JSON.parse(nhl_fixture("shift_chart")).fetch("data") }
  let(:client) { instance_double(NhlClient, play_by_play: pbp_payload) }
  let(:stats_client) { instance_double(NhlStatsClient, shift_chart: shift_payload) }

  before do
    create(:xg_model, active: true)
    [ 8482144, 8484227, 8480188, 8479941, 8480043, 8477497, 8479671, 8479983, 8482705,
      8481567, 8478007 ].each { |nhl_id| create(:player, nhl_player_id: nhl_id) }
  end

  def sync
    described_class.new(game: game, client: client, stats_client: stats_client)
  end

  it "ingests events and shifts, then rebuilds the same game's advanced stats end to end" do
    sync.call

    expect(GameEvent.where(game: game)).to be_present
    expect(Shift.where(game: game)).to be_present
    expect(PlayerGameAdvancedStat.where(game: game)).to be_present
    expect(game.reload.stats_syncing).to be true
  end

  it "reports missing players across both the event and shift ingestion" do
    result = sync

    result.call

    expect(result.missing_players).to include(8477505, 8480893)
  end

  it "is safe to re-run: re-syncing the same game doesn't duplicate rows" do
    2.times { sync.call }

    expect(GameEvent.where(game: game).count).to eq(7)
    expect(Shift.where(game: game).count).to eq(11)
  end

  # Regression guard for TASK-94: a bulk caller defers the whole advanced-stats
  # rebuild to its own end-of-run batch pass instead of triggering it per game.
  it "ingests events/shifts and computes per-game advanced stats, but defers the rebuild, when recompute: :skip" do
    expect {
      described_class.new(game: game, client: client, stats_client: stats_client, recompute: :skip).call
    }.not_to have_enqueued_job(RebuildAdvancedStatsJob)

    expect(PlayerGameAdvancedStat.where(game: game)).to be_present
    expect(game.reload.stats_syncing).to be false
  end

  # Regression guard for TASK-102: goalie_stats must expose the touched rows so a
  # bulk caller can batch their season-stat recompute itself.
  it "exposes the touched GoalieGameStat rows via goalie_stats" do
    goalie = create(:player, position: Player::POSITIONS[:goalie])
    stat = create(:goalie_game_stat, player: goalie, game: game, team: home_team)

    result = sync
    result.call

    expect(result.goalie_stats).to eq([ stat ])
  end
end
