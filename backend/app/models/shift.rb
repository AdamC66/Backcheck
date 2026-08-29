class Shift < ApplicationRecord
  belongs_to :game
  belongs_to :team
  belongs_to :player

  # on: — skipped for BulkUpsert's :bulk_upsert context (TASK-103); the DB's own
  # unique index backs it there instead, via upsert_all's on-conflict match.
  validates :nhl_shift_id, presence: true, uniqueness: { scope: :game_id, on: %i[create update] }
  validates :period, :start_time_seconds, :end_time_seconds, presence: true
  validate :team_played_in_game
  validate :end_after_start

  private

  def team_played_in_game
    return if game.blank? || team.blank?
    return if [ game.home_team_id, game.away_team_id ].include?(team_id)

    errors.add(:team, "must be one of the game's two teams")
  end

  def end_after_start
    return if start_time_seconds.blank? || end_time_seconds.blank?
    return if end_time_seconds >= start_time_seconds

    errors.add(:end_time_seconds, "must be at or after start_time_seconds")
  end
end
