require "rails_helper"

RSpec.describe League, type: :model do
  it "is valid with a name, unique slug, abbreviation, and tier" do
    expect(build(:league)).to be_valid
  end

  it "is invalid without a tier" do
    expect(build(:league, tier: nil)).not_to be_valid
  end
end
