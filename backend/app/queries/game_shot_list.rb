# One game's unblocked shot attempts placed on a full-rink frame where the home team
# always attacks +x, so both teams plot at their own ends (TASK-134). ShotLocationList
# folds every shot onto one attacking net and is single-subject, so this is its own query.
class GameShotList
  FENWICK_EVENT_TYPES = GameEvent::FENWICK_EVENT_TYPES
  GOAL = GameEvent::EVENT_TYPES[:goal]
  SHOT_TYPE_KEYS = GameEvent::SHOT_TYPES.invert.freeze

  Shot = Struct.new(:x, :y, :team_side, :is_goal, :shot_type, :distance, :xg,
                    :shooter_id, :shooter_name, :period, :period_time_seconds, keyword_init: true)

  def initialize(game:)
    @game = game
    @xg_model = XgModel.active
    raise ArgumentError, "no active xg_model" if @xg_model.nil?
  end

  def shots
    @shots ||= located_events.map { |event| build_shot(event) }
  end

  def unlocated_count
    fenwick_events.size - located_events.size
  end

  private

  attr_reader :game, :xg_model

  def fenwick_events
    @fenwick_events ||= begin
      events = GameEvent.where(game: game, event_type: FENWICK_EVENT_TYPES)
                        .where.not(team_id: nil)
                        .includes(:primary_player)
                        .order(:period, :period_time_seconds, :id).to_a
      events.each { |event| event.association(:game).target = game }
      events.reject { |event| shootout?(event) }
    end
  end

  def located_events
    @located_events ||= fenwick_events.select { |event| event.x_coord && event.y_coord && event.target_net_x }
  end

  # home_team_defending_side "right" means home attacks -x that period, so mirror the
  # sheet to keep home attacking +x.
  def build_shot(event)
    flip = event.home_team_defending_side == GameEvent::DEFENDING_SIDES[:right]
    geometry = ShotGeometry.new(x_coord: event.x_coord, y_coord: event.y_coord, target_net_x: event.target_net_x)

    Shot.new(
      x: flip ? -event.x_coord : event.x_coord,
      y: flip ? -event.y_coord : event.y_coord,
      team_side: event.team_id == game.home_team_id ? :home : :away,
      is_goal: event.event_type == GOAL,
      shot_type: event.shot_type && SHOT_TYPE_KEYS[event.shot_type].to_s,
      distance: geometry.distance.round(1),
      xg: XgFormula.calculate(coefficients: xg_model.coefficients, event: event, rebound: rebounds.rebound?(event)).round(4),
      shooter_id: event.primary_player_id,
      shooter_name: event.primary_player && "#{event.primary_player.first_name} #{event.primary_player.last_name}",
      period: event.period,
      period_time_seconds: event.period_time_seconds
    )
  end

  def rebounds
    @rebounds ||= ReboundShots.new(game)
  end

  # Regular-season / preseason shootout is period 5 with no rink context; playoff OT is real.
  def shootout?(event)
    event.period >= 5 && game.game_type != Game::GAME_TYPES[:playoffs]
  end
end
