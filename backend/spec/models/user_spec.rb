require "rails_helper"

RSpec.describe User, type: :model do
  it "is valid with a unique email and a password" do
    expect(build(:user)).to be_valid
  end

  describe "#authorized_for_team?" do
    it "grants a league_admin access to every team in their league" do
      league = create(:league)
      team = create(:team, league: league)
      league_admin_role = create(:role, key: "league_admin", scope_type: "league")
      user = create(:user)
      create(:membership, user: user, role: league_admin_role, scopeable: league)

      expect(user.authorized_for_team?(team)).to be true
    end

    it "denies a user with no membership and no super-admin flag" do
      team = create(:team)
      user = create(:user)

      expect(user.authorized_for_team?(team)).to be false
    end
  end
end
