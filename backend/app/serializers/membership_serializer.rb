class MembershipSerializer
  def initialize(membership)
    @membership = membership
  end

  def as_json(*)
    {
      role: membership.role.key,
      scope_type: membership.scopeable_type == "League" ? "league" : "team",
      scopeable_id: membership.scopeable_id,
      scopeable_name: membership.scopeable.name
    }
  end

  private

  attr_reader :membership
end
