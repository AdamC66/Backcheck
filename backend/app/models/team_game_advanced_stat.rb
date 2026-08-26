class TeamGameAdvancedStat < ApplicationRecord
  belongs_to :game
  belongs_to :team

  validates :strength_state, presence: true, inclusion: { in: PlayerGameAdvancedStat::STRENGTH_STATES.values }
  validates :score_state, presence: true, inclusion: { in: PlayerGameAdvancedStat::SCORE_STATES.values }
  validates :team_id, uniqueness: { scope: [ :game_id, :strength_state, :score_state ] }
  validate :team_played_in_game

  private

  def team_played_in_game
    return if game.blank? || team.blank?
    return if [ game.home_team_id, game.away_team_id ].include?(team_id)

    errors.add(:team, "must be one of the game's two teams")
  end
end
