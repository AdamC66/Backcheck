class User < ApplicationRecord
  has_secure_password

  has_many :memberships, dependent: :destroy

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }

  # A super admin bypasses scope checks entirely — see docs/ARCHITECTURE.md.
  # There's exactly one of these; deliberately not a scoped role.
  def super_admin?
    is_super_admin
  end

  def member_of?(scopeable, role_key: nil)
    return true if super_admin?

    scope = memberships.where(scopeable: scopeable)
    scope = scope.joins(:role).where(roles: { key: role_key }) if role_key
    scope.exists?
  end

  # A League Admin can act on every team within their league without a
  # separate per-team membership row.
  def authorized_for_team?(team, role_key: nil)
    return true if super_admin?
    return true if member_of?(team, role_key: role_key)

    memberships.joins(:role)
               .where(scopeable: team.league)
               .where(roles: { key: "league_admin" })
               .exists?
  end
end
