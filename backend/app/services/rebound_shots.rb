# Which of a game's unblocked shot attempts are rebounds: a shot within
# REBOUND_WINDOW_SECONDS of the same team's previous unblocked shot attempt in the
# same period. Derived from stored columns only — no sequencing field is ingested.
# The window and the "previous attempt was not itself a goal" rule come from a
# real-sequence check across the ingested seasons — see docs/DECISIONS.md (EPIC-23).
class ReboundShots
  REBOUND_WINDOW_SECONDS = 3

  TRIGGER_EVENT_TYPES = GameEvent::EVENT_TYPES.values_at(:shot, :missed_shot).freeze
  FENWICK_EVENT_TYPES = GameEvent::FENWICK_EVENT_TYPES

  def initialize(game)
    @game = game
  end

  def rebound?(event)
    rebound_event_ids.include?(event.id)
  end

  private

  attr_reader :game

  def rebound_event_ids
    @rebound_event_ids ||= begin
      last_trigger_time = {}
      fenwick_events.each_with_object(Set.new) do |event, ids|
        key = [ event.team_id, event.period ]
        previous = last_trigger_time[key]
        ids << event.id if previous && event.period_time_seconds - previous <= REBOUND_WINDOW_SECONDS

        last_trigger_time[key] = event.period_time_seconds if TRIGGER_EVENT_TYPES.include?(event.event_type)
      end
    end
  end

  def fenwick_events
    @fenwick_events ||= GameEvent.where(game: game, event_type: FENWICK_EVENT_TYPES)
                                 .where.not(team_id: nil)
                                 .order(:period, :period_time_seconds, :id).to_a
  end
end
