class GamePeriodSummarySerializer
  SHOT_EVENT_TYPES = GameEvent::EVENT_TYPES.values_at(:goal, :shot).freeze

  def initialize(game)
    @game = game
  end

  def as_json(*)
    { periods: periods.map { |period| line(period) }, totals: totals }
  end

  private

  attr_reader :game

  # A goal is a separate play from shot-on-goal in the feed, never both — SOG must add
  # the two or it falls short of the official boxscore by the goal count (TASK-149).
  def counts
    @counts ||= GameEvent.where(game: game, event_type: SHOT_EVENT_TYPES).where.not(team_id: nil)
                         .group(:period, :team_id, :event_type).count
  end

  def periods
    counts.keys.map(&:first).uniq.sort
  end

  def line(period)
    { period: period, home: side(period, game.home_team_id), away: side(period, game.away_team_id) }
  end

  def side(period, team_id)
    goals = counts.fetch([ period, team_id, GameEvent::EVENT_TYPES[:goal] ], 0)
    shots = counts.fetch([ period, team_id, GameEvent::EVENT_TYPES[:shot] ], 0)
    { goals: goals, shots_on_goal: goals + shots }
  end

  def totals
    { home: sum_sides(game.home_team_id), away: sum_sides(game.away_team_id) }
  end

  def sum_sides(team_id)
    periods.map { |period| side(period, team_id) }
           .reduce(goals: 0, shots_on_goal: 0) do |acc, s|
      { goals: acc[:goals] + s[:goals], shots_on_goal: acc[:shots_on_goal] + s[:shots_on_goal] }
    end
  end
end
