class Season < ApplicationRecord
  belongs_to :league

  has_many :games, dependent: :restrict_with_error
  has_many :team_standings, dependent: :destroy
  has_many :skater_season_stats, dependent: :destroy
  has_many :goalie_season_stats, dependent: :destroy
  has_many :player_season_advanced_stats, dependent: :destroy

  validates :label, presence: true, uniqueness: { scope: :league_id }
  validates :nhl_season_id, uniqueness: true, allow_nil: true
  validates :starts_on, :ends_on, presence: true
  validate :ends_after_starts

  # Empty between seasons, rather than calling a finished season current all summer.
  scope :current, -> { where(starts_on: ..Date.current, ends_on: Date.current..) }
  scope :chronological, -> { order(:starts_on) }

  # A calendar overlap, not an equal range — leagues number seasons independently.
  scope :overlapping, ->(reference) { where("starts_on <= ? AND ends_on >= ?", reference.ends_on, reference.starts_on) }

  private

  def ends_after_starts
    return if starts_on.blank? || ends_on.blank?

    errors.add(:ends_on, "must be after starts_on") if ends_on <= starts_on
  end
end
