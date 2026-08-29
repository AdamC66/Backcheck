class PlayerSeasonAdvancedStat < ApplicationRecord
  belongs_to :player
  belongs_to :team
  belongs_to :season
  belongs_to :as_of_game, class_name: "Game", inverse_of: :player_season_advanced_stats

  validates :strength_state, presence: true, inclusion: { in: PlayerGameAdvancedStat::STRENGTH_STATES.values }
  validates :score_state, presence: true, inclusion: { in: PlayerGameAdvancedStat::SCORE_STATES.values }
  validates :game_type, presence: true, inclusion: { in: Game::GAME_TYPES.values }
  # on: — skipped for BulkUpsert's :bulk_upsert context (TASK-103); the DB's own
  # unique index backs it there instead, via upsert_all's on-conflict match.
  validates :player_id, uniqueness: { scope: [ :season_id, :strength_state, :score_state, :game_type, :as_of_game_id ],
                                      on: %i[create update] }
  validate :team_belongs_to_season_league
  validate :as_of_game_belongs_to_season
  validate :game_type_matches_as_of_game

  private

  def team_belongs_to_season_league
    return if season.blank? || team.blank? || team.league_id == season.league_id

    errors.add(:team, "must belong to the same league as the season")
  end

  def as_of_game_belongs_to_season
    return if as_of_game.blank? || season.blank? || as_of_game.season_id == season_id

    errors.add(:as_of_game, "must belong to the given season")
  end

  # A chain never mixes game types — a playoff correction must not touch the regular
  # season chain, and vice versa.
  def game_type_matches_as_of_game
    return if as_of_game.blank? || game_type.blank? || as_of_game.game_type == game_type

    errors.add(:game_type, "must match as_of_game's game_type")
  end
end
