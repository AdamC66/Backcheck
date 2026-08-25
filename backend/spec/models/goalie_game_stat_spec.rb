require "rails_helper"

RSpec.describe GoalieGameStat, type: :model do
  it "is valid with a player, a game, and one of that game's two teams" do
    expect(build(:goalie_game_stat)).to be_valid
  end

  it "rejects a decision outside W/L/O" do
    stat = build(:goalie_game_stat, decision: "shootout_win")

    expect(stat).not_to be_valid
    expect(stat.errors[:decision]).to include("is not included in the list")
  end

  it "rejects a team that didn't play in the game" do
    stat = build(:goalie_game_stat, team: create(:team))

    expect(stat).not_to be_valid
    expect(stat.errors[:team]).to include("must be one of the game's two teams")
  end
end
