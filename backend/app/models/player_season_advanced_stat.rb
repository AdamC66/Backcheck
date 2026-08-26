class PlayerSeasonAdvancedStat < ApplicationRecord
  belongs_to :player
  belongs_to :team
  belongs_to :season
  belongs_to :as_of_game, class_name: "Game", inverse_of: :player_season_advanced_stats

  validates :strength_state, presence: true, inclusion: { in: PlayerGameAdvancedStat::STRENGTH_STATES.values }
  validates :score_state, presence: true, inclusion: { in: PlayerGameAdvancedStat::SCORE_STATES.values }
  validates :player_id, uniqueness: { scope: [ :season_id, :strength_state, :score_state, :as_of_game_id ] }
  validate :team_belongs_to_season_league
  validate :as_of_game_belongs_to_season

  private

  def team_belongs_to_season_league
    return if season.blank? || team.blank? || team.league_id == season.league_id

    errors.add(:team, "must belong to the same league as the season")
  end

  def as_of_game_belongs_to_season
    return if as_of_game.blank? || season.blank? || as_of_game.season_id == season_id

    errors.add(:as_of_game, "must belong to the given season")
  end
end
