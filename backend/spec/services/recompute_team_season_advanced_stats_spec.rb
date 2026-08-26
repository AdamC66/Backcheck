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
end
