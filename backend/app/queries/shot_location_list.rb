# Team/player subjects only — GameEvent carries no goalie reference for shots-against (TASK-122).
class ShotLocationList
  SHOT_EVENT_TYPES = GameEvent::EVENT_TYPES.values_at(:goal, :shot, :missed_shot).freeze

  STRENGTH_STATES = PlayerGameAdvancedStat::STRENGTH_STATES
  SCORE_STATES = PlayerGameAdvancedStat::SCORE_STATES

  # "5v5" collapses to even_strength — GameEvent can't tell it from 4v4/3v3, as elsewhere in the pipeline.
  GAME_EVENT_STRENGTH = {
    STRENGTH_STATES[:five_v_five] => GameEvent::STRENGTH_STATES[:even_strength],
    STRENGTH_STATES[:power_play] => GameEvent::STRENGTH_STATES[:power_play],
    STRENGTH_STATES[:short_handed] => GameEvent::STRENGTH_STATES[:short_handed]
  }.freeze

  EVENT_TYPE_KEYS = GameEvent::EVENT_TYPES.invert.freeze
  SHOT_TYPE_KEYS = GameEvent::SHOT_TYPES.invert.freeze
  STRENGTH_KEYS = GameEvent::STRENGTH_STATES.invert.freeze

  Shot = Struct.new(:game_id, :period, :event_type, :shot_type, :strength_state,
                    :offensive_x, :offensive_y, :distance, :danger_zone, keyword_init: true)

  class InvalidSubject < ArgumentError; end

  def initialize(games:, team: nil, player: nil, strength_state: STRENGTH_STATES[:all], score_state: SCORE_STATES[:all])
    raise InvalidSubject, "pass exactly one of team:/player:" unless team.nil? ^ player.nil?

    @games = games
    @team = team
    @player = player
    @strength_state = strength_state
    @score_state = score_state
  end

  def shots
    @shots ||= located_events.map { |event| build_shot(event) }
  end

  def unlocated_count
    filtered_events.size - located_events.size
  end

  private

  def filtered_events
    @filtered_events ||= begin
      scope = GameEvent.where(game_id: game_ids, event_type: SHOT_EVENT_TYPES).preload(:game)
      scope = @team ? scope.where(team_id: @team.id) : scope.where(primary_player_id: @player.id)
      scope = scope.where(strength_state: mapped_strength) if mapped_strength

      events = scope.to_a
      close_only? ? events.select { |event| timeline_for(event.game).close?(event) } : events
    end
  end

  def located_events
    @located_events ||= filtered_events.select { |event| event.x_coord && event.y_coord && event.target_net_x }
  end

  def build_shot(event)
    geometry = ShotGeometry.new(x_coord: event.x_coord, y_coord: event.y_coord, target_net_x: event.target_net_x)

    Shot.new(
      game_id: event.game_id,
      period: event.period,
      event_type: EVENT_TYPE_KEYS[event.event_type],
      shot_type: event.shot_type && SHOT_TYPE_KEYS[event.shot_type],
      strength_state: event.strength_state && STRENGTH_KEYS[event.strength_state],
      offensive_x: geometry.offensive_x,
      offensive_y: geometry.offensive_y,
      distance: geometry.distance,
      danger_zone: DangerZone.classify(x_coord: event.x_coord, y_coord: event.y_coord, target_net_x: event.target_net_x)
    )
  end

  def game_ids
    @game_ids ||= @games.is_a?(ActiveRecord::Relation) ? @games.pluck(:id) : Array(@games).map(&:id)
  end

  def mapped_strength
    GAME_EVENT_STRENGTH[@strength_state]
  end

  def close_only?
    @score_state == SCORE_STATES[:close]
  end

  def timeline_for(game)
    @timelines ||= {}
    @timelines[game.id] ||= GameScoreTimeline.new(game)
  end
end
