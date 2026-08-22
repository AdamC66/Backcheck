require "rails_helper"

RSpec.describe Role, type: :model do
  it "is valid with a unique key and a known scope_type" do
    expect(build(:role)).to be_valid
  end

  it "rejects a scope_type outside league/team" do
    expect(build(:role, scope_type: "galaxy")).not_to be_valid
  end
end
