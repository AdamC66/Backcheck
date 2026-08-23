require "rails_helper"

RSpec.describe PossibleDuplicatePlayer, type: :model do
  it "is valid with two players in ascending id order and a detail" do
    expect(build(:possible_duplicate_player)).to be_valid
  end

  it "rejects the pair written in descending id order" do
    a = create(:player)
    b = create(:player)
    reversed = build(:possible_duplicate_player, player_a: [ a, b ].max_by(&:id), player_b: [ a, b ].min_by(&:id))

    expect(reversed).not_to be_valid
    expect(reversed.errors[:player_a_id]).to include("must be the lower id of the pair")
  end
end
