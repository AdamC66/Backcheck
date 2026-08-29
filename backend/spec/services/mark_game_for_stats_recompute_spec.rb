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

  # Regression guard for TASK-94: a starts_at comparison alone spans every season
  # chronologically, so this must stay scoped to the game's own season.
  it "never marks another season's rows stale, even for the same player" do
    other_season = create(:season, league: season.league, starts_on: season.ends_on + 1.day,
                          ends_on: season.ends_on + 200.days)
    other_game = create(:game, season: other_season, home_team: team, starts_at: season.ends_on + 10.days)
    other_row = create(:player_season_advanced_stat, player: player, season: other_season, team: team,
                       as_of_game: other_game, stale: false)

    described_class.new(game: game).call

    expect(other_row.reload.stale).to be false
  end

  # Regression guard for TASK-94: mode: :skip must defer the whole rebuild, not
  # just skip the job.
  it "does nothing when mode: :skip — no stale-marking, no job, no stats_syncing flag" do
    expect {
      described_class.new(game: game, mode: :skip).call
    }.not_to have_enqueued_job(RebuildAdvancedStatsJob)

    expect(game.reload.stats_syncing).to be false
    expect(PlayerSeasonAdvancedStat.find_by(as_of_game: later_game).stale).to be false
  end
end
