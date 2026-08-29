require "rails_helper"

RSpec.describe RecomputeTeamSeasonAdvancedStats do
  let(:season) { create(:season) }
  let(:team) { create(:team, league: season.league) }

  def recompute
    described_class.new(team: team, season: season).call
  end

  it "sums a team's per-game advanced stats across the season" do
    create(:team_game_advanced_stat, team: team, game: create(:game, season: season, home_team: team), corsi_for: 50)
    create(:team_game_advanced_stat, team: team, game: create(:game, season: season, home_team: team), corsi_for: 51)

    recompute

    stat = TeamSeasonAdvancedStat.find_by(team: team, season: season,
                                          strength_state: PlayerGameAdvancedStat::STRENGTH_STATES[:all])
    expect(stat).to have_attributes(games_played: 2, corsi_for: 101)
  end

  it "clears a rollup row once its underlying games are gone" do
    game = create(:game, season: season, home_team: team)
    create(:team_game_advanced_stat, team: team, game: game)
    recompute
    TeamGameAdvancedStat.where(team: team).destroy_all

    recompute

    expect(TeamSeasonAdvancedStat.find_by(team: team, season: season)).to be_nil
  end

  it "re-sums regular-season and preseason games into separate rows, never combined" do
    regular_game = create(:game, season: season, home_team: team, game_type: Game::GAME_TYPES[:regular_season])
    preseason_game = create(:game, season: season, home_team: team, game_type: Game::GAME_TYPES[:preseason])
    create(:team_game_advanced_stat, team: team, game: regular_game, corsi_for: 50)
    create(:team_game_advanced_stat, team: team, game: preseason_game, corsi_for: 5)

    recompute

    regular = TeamSeasonAdvancedStat.find_by(team: team, season: season,
                                             game_type: Game::GAME_TYPES[:regular_season])
    preseason = TeamSeasonAdvancedStat.find_by(team: team, season: season,
                                               game_type: Game::GAME_TYPES[:preseason])
    expect(regular).to have_attributes(games_played: 1, corsi_for: 50)
    expect(preseason).to have_attributes(games_played: 1, corsi_for: 5)
  end

  # Regression guard for TASK-95: season totals must aggregate in a handful of
  # queries, not one per column per dimension.
  it "computes a team's season totals in a handful of queries, not 11 per dimension" do
    create(:team_game_advanced_stat, team: team, game: create(:game, season: season, home_team: team))

    query_count = 0
    counter = lambda do |*, payload|
      query_count += 1 unless payload[:name] == "SCHEMA" || payload[:sql] =~ /\A(BEGIN|COMMIT|SAVEPOINT|RELEASE)/i
    end

    ActiveSupport::Notifications.subscribed(counter, "sql.active_record") { recompute }

    # One dimension here: ~4 today (base_rows load, existing_season_rows pluck,
    # upsert lookup/write) — nowhere near the 11+ a reintroduced per-column query would add.
    expect(query_count).to be <= 8
  end
end
