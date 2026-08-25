class Player < ApplicationRecord
  # "forward" exists because the AHL feed reports some skaters as F with no wing.
  POSITIONS = { center: 1, left_wing: 2, right_wing: 3, forward: 4, defense: 5, goalie: 6 }.freeze

  belongs_to :draft_team, class_name: "Team", optional: true

  has_many :external_ids, class_name: "PlayerExternalId", dependent: :destroy, inverse_of: :player
  has_many :roster_spots, dependent: :destroy
  has_many :roster_statuses, dependent: :destroy
  has_many :skater_game_stats, dependent: :destroy
  has_many :goalie_game_stats, dependent: :destroy
  has_many :skater_season_stats, dependent: :destroy
  has_many :goalie_season_stats, dependent: :destroy

  before_validation :assign_normalized_name

  validates :first_name, :last_name, presence: true
  validates :normalized_name, presence: true
  validates :position, inclusion: { in: POSITIONS.values }
  validates :nhl_player_id, uniqueness: true, allow_nil: true

  scope :alphabetical, -> { order(:last_name, :first_name) }

  # Squashed to one token rather than spaced, because the sources disagree on spacing
  # and punctuation as well as accents: "T.J. Brodie" has to land on "TJ Brodie".
  def self.normalize_name(*parts)
    ActiveSupport::Inflector.transliterate(parts.join(" "), "").downcase.gsub(/[^a-z0-9]/, "")
  end

  private

  def assign_normalized_name
    self.normalized_name = self.class.normalize_name(first_name, last_name)
  end
end
