class Game < ApplicationRecord
  # Upstream gameType; preseason shares a payload with the rest, so it can't be inferred.
  GAME_TYPES = { preseason: 1, regular_season: 2, playoffs: 3 }.freeze

  belongs_to :season
  belongs_to :home_team, class_name: "Team"
  belongs_to :away_team, class_name: "Team"

  has_many :lineups, dependent: :destroy
  has_many :skater_game_stats, dependent: :destroy
  has_many :goalie_game_stats, dependent: :destroy
  has_many :game_events, dependent: :destroy
  has_many :shifts, dependent: :destroy
  has_many :player_game_advanced_stats, dependent: :destroy
  has_many :player_season_advanced_stats, foreign_key: :as_of_game_id, dependent: :destroy,
           inverse_of: :as_of_game
  has_many :team_game_advanced_stats, dependent: :destroy

  validates :nhl_game_id, presence: true, uniqueness: true
  validates :game_type, presence: true
  validates :starts_at, :game_date, :state, presence: true
  validate :teams_belong_to_season_league

  scope :chronological, -> { order(:starts_at) }
  scope :for_season, ->(season) { where(season: season) }
  scope :for_team, ->(team) { where(home_team: team).or(where(away_team: team)) }
  scope :regular_season, -> { where(game_type: GAME_TYPES[:regular_season]) }
  # A boxscore is meaningless before a game is actually over; upstream uses both codes
  # for that (OFF appears after final review, past plain FINAL).
  scope :finished, -> { where(state: %w[FINAL OFF]) }

  private

  # Without this an NHL season could be paired with an AHL team.
  def teams_belong_to_season_league
    return if season.blank?

    [ [ :home_team, home_team ], [ :away_team, away_team ] ].each do |attribute, team|
      next if team.blank? || team.league_id == season.league_id

      errors.add(attribute, "must belong to the same league as the season")
    end
  end
end
