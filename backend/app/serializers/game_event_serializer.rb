class GameEventSerializer
  EVENT_TYPE_KEYS = GameEvent::EVENT_TYPES.invert.freeze
  STRENGTH_STATE_KEYS = GameEvent::STRENGTH_STATES.invert.freeze

  def initialize(event)
    @event = event
  end

  def as_json(*)
    base.merge(penalty? ? penalty_detail : goal_detail)
  end

  private

  attr_reader :event

  def penalty?
    event.event_type == GameEvent::EVENT_TYPES[:penalty]
  end

  def base
    {
      id: event.nhl_event_id,
      type: EVENT_TYPE_KEYS.fetch(event.event_type).to_s,
      period: event.period,
      period_time_seconds: event.period_time_seconds,
      team_id: event.team_id,
      strength_state: event.strength_state && STRENGTH_STATE_KEYS.fetch(event.strength_state).to_s
    }
  end

  def goal_detail
    {
      scorer: player_json(event.primary_player),
      assists: [ event.secondary_player, event.tertiary_player ].compact.map { |player| player_json(player) }
    }
  end

  def penalty_detail
    {
      committed_by: player_json(event.primary_player),
      drawn_by: player_json(event.secondary_player),
      infraction: event.infraction,
      penalty_type: event.penalty_type,
      penalty_minutes: event.penalty_minutes
    }
  end

  def player_json(player)
    player && PlayerSerializer.new(player).as_json
  end
end
