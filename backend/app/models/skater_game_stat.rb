class SkaterGameStat < ApplicationRecord
  belongs_to :player
  belongs_to :game
  belongs_to :team

  validates :player_id, uniqueness: { scope: :game_id }
  validate :team_played_in_game

  private

  def team_played_in_game
    return if game.blank? || team.blank?
    return if [ game.home_team_id, game.away_team_id ].include?(team_id)

    errors.add(:team, "must be one of the game's two teams")
  end
end
