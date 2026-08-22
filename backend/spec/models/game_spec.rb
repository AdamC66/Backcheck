require "rails_helper"

RSpec.describe Game, type: :model do
  it "is valid with a season, two teams from that league, and a schedule slot" do
    expect(build(:game)).to be_valid
  end

  it "rejects a team from a different league than the season" do
    game = build(:game, away_team: create(:team))

    expect(game).not_to be_valid
    expect(game.errors[:away_team]).to include("must belong to the same league as the season")
  end
end
