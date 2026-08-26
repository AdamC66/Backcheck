require "rails_helper"

RSpec.describe MarkGameForStatsRecompute do
  let(:season) { create(:season) }
  let(:team) { create(:team, league: season.league) }
  let(:earlier_game) { create(:game, season: season, home_team: team, starts_at: Time.utc(2025, 10, 1)) }
  let(:game) { create(:game, season: season, home_team: team, starts_at: Time.utc(2025, 10, 5)) }
  let(:later_game) { create(:game, season: season, home_team: team, starts_at: Time.utc(2025, 10, 10)) }
  let(:player) { create(:player) }

  before do
    create(:player_game_advanced_stat, game: game, player: player, team: team)
    create(:player_season_advanced_stat, player: player, season: season, team: team, as_of_game: earlier_game,
           stale: false)
    create(:player_season_advanced_stat, player: player, season: season, team: team, as_of_game: later_game,
           stale: false)
  end

  it "flags stats_syncing and the affected player's stale tail, then enqueues the rebuild job" do
    expect {
      described_class.new(game: game).call
    }.to have_enqueued_job(RebuildAdvancedStatsJob).with(game.id)

    expect(game.reload.stats_syncing).to be true
    expect(PlayerSeasonAdvancedStat.find_by(as_of_game: earlier_game).stale).to be false
    expect(PlayerSeasonAdvancedStat.find_by(as_of_game: later_game).stale).to be true
  end
end
