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
  has_many :skater_game_stats, dependent: :restrict_with_error
  has_many :goalie_game_stats, dependent: :restrict_with_error
  has_many :game_events, dependent: :restrict_with_error
  has_many :shifts, dependent: :restrict_with_error
  has_many :player_game_advanced_stats, dependent: :restrict_with_error
  has_many :skater_season_stats, dependent: :destroy
  has_many :goalie_season_stats, dependent: :destroy
  has_many :player_season_advanced_stats, dependent: :destroy

  scope :alphabetical, -> { order(:name) }
  scope :with_logo, -> { includes(logo_attachment: :blob) }

  validates :name, presence: true
  validates :abbreviation, presence: true, uniqueness: { scope: :league_id }
  validates :nhl_team_id, uniqueness: true, allow_nil: true
  validates :primary_color, :secondary_color, :tertiary_color,
            format: { with: HEX_COLOR }, allow_nil: true

  # Newest season *with roster spots*, not just the newest season row — a season can be
  # seeded well ahead of this team having any data in it.
  def current_roster_season
    league.seasons.where(id: RosterSpot.where(team: self).select(:season_id)).order(:starts_on).last
  end

  # Same reasoning as current_roster_season. A team can have goalie stats with no
  # matching skater stats yet mid-backfill, so both are checked.
  def current_stats_season
    league.seasons.where(id: SkaterSeasonStat.where(team: self).select(:season_id))
          .or(league.seasons.where(id: GoalieSeasonStat.where(team: self).select(:season_id)))
          .order(:starts_on).last
  end
end
