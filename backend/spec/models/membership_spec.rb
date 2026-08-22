require "rails_helper"

RSpec.describe Membership, type: :model do
  it "is valid with a matching role scope_type and scopeable" do
    expect(build(:membership)).to be_valid
  end

  it "rejects a team-scoped role attached to a League" do
    league = create(:league)
    role = create(:role, scope_type: "team")
    membership = build(:membership, scopeable: league, role: role)

    expect(membership).not_to be_valid
  end
end
