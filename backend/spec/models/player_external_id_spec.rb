require "rails_helper"

RSpec.describe PlayerExternalId, type: :model do
  it "is valid with a player, source, and external id" do
    expect(build(:player_external_id)).to be_valid
  end

  it "refuses to map one source record to a second player" do
    taken = create(:player_external_id)
    duplicate = build(:player_external_id, source: taken.source, external_id: taken.external_id)

    expect(duplicate).not_to be_valid
    expect(duplicate.errors[:external_id]).to include("has already been taken")
  end
end
