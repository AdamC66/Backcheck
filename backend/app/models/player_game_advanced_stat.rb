class PlayerGameAdvancedStat < ApplicationRecord
  STRENGTH_STATES = { all: "all", five_v_five: "5v5", power_play: "pp", short_handed: "sh" }.freeze
  # "close" = within one goal in the 1st/2nd, tied in the 3rd — all of OT counts as close
  # regardless of margin. Evaluated using the score entering an event, not after it.
  SCORE_STATES = { all: "all", close: "close" }.freeze

  belongs_to :game
  belongs_to :player
  belongs_to :team
  belongs_to :xg_model

  validates :strength_state, presence: true, inclusion: { in: STRENGTH_STATES.values }
  validates :score_state, presence: true, inclusion: { in: SCORE_STATES.values }
  # on: — skipped for BulkUpsert's :bulk_upsert context (TASK-103); the DB's own
  # unique index backs it there instead, via upsert_all's on-conflict match.
  validates :player_id, uniqueness: { scope: [ :game_id, :strength_state, :score_state ], on: %i[create update] }
  validate :team_played_in_game

  private

  def team_played_in_game
    return if game.blank? || team.blank?
    return if [ game.home_team_id, game.away_team_id ].include?(team_id)

    errors.add(:team, "must be one of the game's two teams")
  end
end
