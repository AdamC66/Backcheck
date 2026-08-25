class GoalieSeasonStat < ApplicationRecord
  belongs_to :player
  belongs_to :team
  belongs_to :season

  validates :game_type, presence: true, inclusion: { in: Game::GAME_TYPES.values }
  validates :player_id, uniqueness: { scope: [ :team_id, :season_id, :game_type ] }
  validate :team_belongs_to_season_league

  scope :for_season, ->(season) { where(season: season) }
  scope :preseason, -> { where(game_type: Game::GAME_TYPES[:preseason]) }
  scope :regular_season, -> { where(game_type: Game::GAME_TYPES[:regular_season]) }
  scope :playoffs, -> { where(game_type: Game::GAME_TYPES[:playoffs]) }

  private

  def team_belongs_to_season_league
    return if season.blank? || team.blank? || team.league_id == season.league_id

    errors.add(:team, "must belong to the same league as the season")
  end
end
