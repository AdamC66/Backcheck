require "rails_helper"

RSpec.describe SkaterSeasonStat, type: :model do
  it "is valid with a player, team, season, and game type" do
    expect(build(:skater_season_stat)).to be_valid
  end

  it "rejects a team from a different league than the season" do
    stat = build(:skater_season_stat, team: create(:team))

    expect(stat).not_to be_valid
    expect(stat.errors[:team]).to include("must belong to the same league as the season")
  end

  it "lets the same stint hold separate regular-season and playoff rows" do
    player = create(:player)
    season = create(:season)
    team = create(:team, league: season.league)
    create(:skater_season_stat, player: player, season: season, team: team,
           game_type: Game::GAME_TYPES[:regular_season])

    playoffs = build(:skater_season_stat, player: player, season: season, team: team,
                      game_type: Game::GAME_TYPES[:playoffs])

    expect(playoffs).to be_valid
  end
end
