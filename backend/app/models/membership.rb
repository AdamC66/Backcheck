class Membership < ApplicationRecord
  belongs_to :user
  belongs_to :role
  belongs_to :scopeable, polymorphic: true

  validates :user_id, uniqueness: { scope: [ :role_id, :scopeable_type, :scopeable_id ] }
  validate :scope_type_matches_role

  private

  def scope_type_matches_role
    return if role.blank? || scopeable.blank?

    expected = scopeable_type == "League" ? "league" : "team"
    errors.add(:role, "scope_type must be '#{expected}' for a #{scopeable_type} membership") if role.scope_type != expected
  end
end
