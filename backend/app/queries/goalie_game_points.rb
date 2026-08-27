# The boxscore never carries a goalie's own goals/assists (confirmed live — Nedeljkovic's
# Jan 2025 goal+assist game has no such keys), so this derives them from game_events.
class GoalieGamePoints
  def initialize(game:, player:)
    @game = game
    @player = player
  end

  def goals
    goal_events.where(primary_player: player).count
  end

  def assists
    goal_events.where(secondary_player: player).or(goal_events.where(tertiary_player: player)).count
  end

  private

  attr_reader :game, :player

  def goal_events
    GameEvent.where(game: game, event_type: GameEvent::EVENT_TYPES[:goal])
  end
end
