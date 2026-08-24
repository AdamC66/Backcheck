class UserSerializer
  def initialize(user)
    @user = user
  end

  def as_json(*)
    {
      id: user.id,
      email: user.email,
      is_super_admin: user.is_super_admin,
      memberships: user.memberships.map { |membership| MembershipSerializer.new(membership).as_json }
    }
  end

  private

  attr_reader :user
end
