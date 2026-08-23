class Team < ApplicationRecord
  HEX_COLOR = /\A#\h{6}\z/

  belongs_to :league
  has_one_attached :logo

  has_many :team_standings, dependent: :destroy
  has_many :home_games, class_name: "Game", foreign_key: :home_team_id, dependent: :restrict_with_error,
           inverse_of: :home_team
  has_many :away_games, class_name: "Game", foreign_key: :away_team_id, dependent: :restrict_with_error,
           inverse_of: :away_team
  has_many :affiliations_as_parent, class_name: "TeamAffiliation", foreign_key: :parent_team_id,
           dependent: :destroy, inverse_of: :parent_team
  has_many :affiliations_as_affiliate, class_name: "TeamAffiliation", foreign_key: :affiliate_team_id,
           dependent: :destroy, inverse_of: :affiliate_team

  scope :alphabetical, -> { order(:name) }
  scope :with_logo, -> { includes(logo_attachment: :blob) }

  validates :name, presence: true
  validates :abbreviation, presence: true, uniqueness: { scope: :league_id }
  validates :nhl_team_id, uniqueness: true, allow_nil: true
  validates :primary_color, :secondary_color, :tertiary_color,
            format: { with: HEX_COLOR }, allow_nil: true
end
