require "rails_helper"

RSpec.describe Player, type: :model do
  it "is valid with a name and a position" do
    expect(build(:player)).to be_valid
  end

  it "lands two spellings of the same name on one match key" do
    nhl = create(:player, first_name: "David", last_name: "Kampf")
    ahl = build(:player, first_name: "David", last_name: "Kämpf", nhl_player_id: nil)

    expect(ahl.tap(&:valid?).normalized_name).to eq(nhl.normalized_name)
    expect(described_class.normalize_name("T.J.", "Brodie")).to eq("tjbrodie")
  end
end
