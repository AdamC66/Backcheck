# The boxscore never carries a goalie's own goals/assists (confirmed live — Nedeljkovic's
# Jan 2025 goal+assist game has no such keys), so this derives them from game_events.
class GoalieGamePoints
  def initialize(game:, player:)
    @game = game
    @player = player
  end

  def goals
    goal_events.count { |event| event.primary_player_id == player.id }
  end

  def assists
    goal_events.count { |event| event.secondary_player_id == player.id || event.tertiary_player_id == player.id }
  end

  private

  attr_reader :game, :player

  # Loaded once and reused by both #goals and #assists instead of a separate
  # query each (TASK-101) — a game's goal events are few enough to hold in memory.
  def goal_events
    @goal_events ||= GameEvent.where(game: game, event_type: GameEvent::EVENT_TYPES[:goal]).to_a
  end
end
