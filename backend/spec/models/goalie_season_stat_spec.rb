require "rails_helper"

RSpec.describe GoalieSeasonStat, type: :model do
  it "is valid with a player, team, season, and game type" do
    expect(build(:goalie_season_stat)).to be_valid
  end

  it "rejects a team from a different league than the season" do
    stat = build(:goalie_season_stat, team: create(:team))

    expect(stat).not_to be_valid
    expect(stat.errors[:team]).to include("must belong to the same league as the season")
  end

  it "allows only one row per player/team/season/game_type" do
    existing = create(:goalie_season_stat)

    dup = build(:goalie_season_stat, player: existing.player, team: existing.team,
                season: existing.season, game_type: existing.game_type)

    expect(dup).not_to be_valid
  end
end
