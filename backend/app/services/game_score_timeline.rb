class GameScoreTimeline
  def initialize(game)
    @game = game
  end

  def score_before(event)
    key = [ event.period, event.period_time_seconds, event.id ]
    home = 0
    away = 0

    goals.each do |goal|
      break if ([ goal.period, goal.period_time_seconds, goal.id ] <=> key) >= 0

      home += 1 if goal.team_id == game.home_team_id
      away += 1 if goal.team_id == game.away_team_id
    end

    [ home, away ]
  end

  def close?(event)
    home, away = score_before(event)
    diff = (home - away).abs
    return true if event.period >= 4
    return diff <= 1 if event.period <= 2

    diff.zero?
  end

  private

  attr_reader :game

  def goals
    @goals ||= GameEvent.where(game: game, event_type: GameEvent::EVENT_TYPES[:goal])
                        .order(:period, :period_time_seconds, :id).to_a
  end
end
