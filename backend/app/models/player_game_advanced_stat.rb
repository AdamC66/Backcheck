class PlayerGameAdvancedStat < ApplicationRecord
  STRENGTH_STATES = { all: "all", five_v_five: "5v5", power_play: "pp", short_handed: "sh" }.freeze

  belongs_to :game
  belongs_to :player
  belongs_to :team
  belongs_to :xg_model

  validates :strength_state, presence: true, inclusion: { in: STRENGTH_STATES.values }
  validates :player_id, uniqueness: { scope: [ :game_id, :strength_state ] }
  validate :team_played_in_game

  private

  def team_played_in_game
    return if game.blank? || team.blank?
    return if [ game.home_team_id, game.away_team_id ].include?(team_id)

    errors.add(:team, "must be one of the game's two teams")
  end
end
