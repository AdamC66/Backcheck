class Lineup < ApplicationRecord
  belongs_to :team
  belongs_to :game
  has_many :slots, class_name: "LineupSlot", dependent: :destroy, inverse_of: :lineup

  validates :team_id, uniqueness: { scope: :game_id }
  validate :team_plays_in_the_game
  validate :at_most_one_starting_goalie

  # Scheduled puck drop, deliberately not game.state reaching FINAL/OFF — this gates both
  # public visibility and the coach edit lock, and must not wait on a schedule sync.
  def historical?
    game.starts_at <= Time.current
  end

  private

  def team_plays_in_the_game
    return if game.blank? || [ game.home_team_id, game.away_team_id ].include?(team_id)

    errors.add(:team, "does not play in this game")
  end

  def at_most_one_starting_goalie
    starters = slots.select { |slot| slot.unit_type == "goalie" && slot.unit_number == 1 }
    errors.add(:base, "cannot have more than one starting goalie") if starters.size > 1
  end
end
