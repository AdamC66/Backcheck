require "rails_helper"

RSpec.describe Team, type: :model do
  it "is valid with a name, abbreviation, and a league" do
    expect(build(:team)).to be_valid
  end

  it "rejects a color that isn't a hex triplet" do
    expect(build(:team, primary_color: "red")).not_to be_valid
  end
end
