require "rails_helper"

RSpec.describe SkaterGameStat, type: :model do
  it "is valid with a player, a game, and one of that game's two teams" do
    expect(build(:skater_game_stat)).to be_valid
  end

  it "rejects a team that didn't play in the game" do
    stat = build(:skater_game_stat, team: create(:team))

    expect(stat).not_to be_valid
    expect(stat.errors[:team]).to include("must be one of the game's two teams")
  end

  it "allows only one stat line per player per game" do
    existing = create(:skater_game_stat)

    dup = build(:skater_game_stat, player: existing.player, game: existing.game, team: existing.team)

    expect(dup).not_to be_valid
  end
end
