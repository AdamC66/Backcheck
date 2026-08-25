class GoalieGameStat < ApplicationRecord
  DECISIONS = { win: "W", loss: "L", ot_loss: "O" }.freeze

  belongs_to :player
  belongs_to :game
  belongs_to :team

  validates :player_id, uniqueness: { scope: :game_id }
  validates :decision, inclusion: { in: DECISIONS.values }, allow_nil: true
  validate :team_played_in_game

  private

  def team_played_in_game
    return if game.blank? || team.blank?
    return if [ game.home_team_id, game.away_team_id ].include?(team_id)

    errors.add(:team, "must be one of the game's two teams")
  end
end
