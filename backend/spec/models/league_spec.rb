require "rails_helper"

RSpec.describe League, type: :model do
  it "is valid with a name and unique slug" do
    expect(build(:league)).to be_valid
  end
end
