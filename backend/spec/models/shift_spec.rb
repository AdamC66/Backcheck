require "rails_helper"

RSpec.describe Shift, type: :model do
  it "is valid with a game, a team that played in it, and a player" do
    expect(build(:shift)).to be_valid
  end

  it "rejects a team that didn't play in the game" do
    shift = build(:shift, team: create(:team))

    expect(shift).not_to be_valid
    expect(shift.errors[:team]).to include("must be one of the game's two teams")
  end

  it "requires nhl_shift_id to be unique within a game" do
    existing = create(:shift)

    dup = build(:shift, game: existing.game, nhl_shift_id: existing.nhl_shift_id)

    expect(dup).not_to be_valid
  end
end
