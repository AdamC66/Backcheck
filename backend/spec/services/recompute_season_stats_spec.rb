require "rails_helper"

RSpec.describe RecomputeSeasonStats do
  let(:season) { create(:season) }
  let(:team) { create(:team, league: season.league) }
  let(:player) { create(:player) }

  def recompute
    described_class.new(player: player, team: team, season: season,
                         game_type: Game::GAME_TYPES[:regular_season]).call
  end

  it "sums a player's stat lines across every game played for that team this season" do
    2.times do
      game = create(:game, season: season, home_team: team)
      create(:skater_game_stat, player: player, game: game, team: team, goals: 2, assists: 1)
    end

    recompute

    stat = SkaterSeasonStat.find_by(player: player, team: team, season: season)
    expect(stat).to have_attributes(games_played: 2, goals: 4, assists: 2)
  end

  it "sums a goalie's own goals/assists into the season rollup too" do
    game = create(:game, season: season, home_team: team)
    create(:goalie_game_stat, player: player, game: game, team: team, goals: 1, assists: 1)

    recompute

    stat = GoalieSeasonStat.find_by(player: player, team: team, season: season)
    expect(stat).to have_attributes(goals: 1, assists: 1)
  end

  it "clears a rollup row once its underlying games are gone" do
    game = create(:game, season: season, home_team: team)
    create(:skater_game_stat, player: player, game: game, team: team)
    recompute
    SkaterGameStat.where(player: player, team: team).destroy_all

    recompute

    expect(SkaterSeasonStat.find_by(player: player, team: team, season: season)).to be_nil
  end
end
