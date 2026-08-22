class League < ApplicationRecord
  has_many :teams, dependent: :restrict_with_error
  has_many :seasons, dependent: :restrict_with_error
  has_one_attached :logo

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :abbreviation, presence: true, uniqueness: true
  validates :tier, presence: true, numericality: { only_integer: true, greater_than: 0 }

  scope :ranked, -> { order(:tier, :name) }
  scope :with_logo, -> { includes(logo_attachment: :blob) }

  # A team-scoped membership implies access to that team's league, so both membership
  # shapes have to be considered — see docs/ARCHITECTURE.md (Auth & multi-tenancy).
  scope :visible_to, ->(user) {
    next all if user.super_admin?

    scoped_league_ids = user.memberships.where(scopeable_type: "League").select(:scopeable_id)
    scoped_team_ids = user.memberships.where(scopeable_type: "Team").select(:scopeable_id)

    where(id: scoped_league_ids).or(where(id: Team.where(id: scoped_team_ids).select(:league_id)))
  }
end
