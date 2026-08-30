# A proxy, not tracked zone time: each event's zone is forward-filled to the next, so
# the gaps between events bias toward event-dense zones. See docs/DECISIONS.md.
class ZoneOccupancyTimeline
  ZONE_EVENT_TYPES = GameEvent::EVENT_TYPES.values_at(
    :goal, :shot, :missed_shot, :blocked_shot, :faceoff, :hit, :giveaway, :takeaway, :penalty
  ).freeze

  NEUTRAL_ZONE_MAX_ABS_X = 25

  ZONES = %i[offensive neutral defensive].freeze

  Segment = Struct.new(:period, :start_seconds, :end_seconds, :home_zone, keyword_init: true)

  def initialize(game)
    @game = game
  end

  def segments(period)
    all_segments[period] || []
  end

  def puck_zone_for(event, team_id:)
    home_zone = home_zone_for(event)
    return if home_zone.nil?

    team_id == game.home_team_id ? home_zone : mirror_zone(home_zone)
  end

  def zone_durations(period:, from_seconds:, to_seconds:, team_id:)
    mirror = team_id != game.home_team_id
    totals = ZONES.index_with(0)
    segments(period).each do |segment|
      overlap = [ segment.end_seconds, to_seconds ].min - [ segment.start_seconds, from_seconds ].max
      next if overlap <= 0

      zone = mirror ? mirror_zone(segment.home_zone) : segment.home_zone
      totals[zone] += overlap
    end
    totals
  end

  private

  attr_reader :game

  def all_segments
    @all_segments ||= events_by_period.each_with_object({}) do |(period, events), acc|
      length = period_length(period, events)
      next if length.nil? || length.zero?

      points = zone_points(events)
      next if points.empty?

      acc[period] = segments_from_points(points, period, length)
    end
  end

  def events_by_period
    GameEvent.where(game: game, event_type: ZONE_EVENT_TYPES)
             .order(:period, :period_time_seconds, :id)
             .group_by(&:period)
  end

  def zone_points(events)
    anchors = events.filter_map do |event|
      zone = home_zone_for(event)
      [ event.period_time_seconds, zone ] if zone
    end
    return [] if anchors.empty?

    opening = home_zone_for(events.find { |e| e.event_type == GameEvent::EVENT_TYPES[:faceoff] }) || anchors.first.last
    points = [ [ 0, opening ] ]
    anchors.each do |seconds, zone|
      if points.last.first == seconds
        points[-1] = [ seconds, zone ]
      else
        points << [ seconds, zone ]
      end
    end
    points
  end

  def segments_from_points(points, period, length)
    points.each_with_index.each_with_object([]) do |((seconds, zone), index), segs|
      ends_at = index == points.length - 1 ? length : points[index + 1].first
      next if ends_at <= seconds

      if segs.last && segs.last.home_zone == zone && segs.last.end_seconds == seconds
        segs.last.end_seconds = ends_at
      else
        segs << Segment.new(period: period, start_seconds: seconds, end_seconds: ends_at, home_zone: zone)
      end
    end
  end

  def period_length(period, events)
    Shift.where(game: game, period: period).maximum(:end_time_seconds) ||
      events.map(&:period_time_seconds).max
  end

  def home_zone_for(event)
    return if event.nil?

    if event.x_coord && event.home_team_defending_side
      zone_from_coords(event.x_coord, event.home_team_defending_side)
    elsif event.zone && event.team_id && event.event_type != GameEvent::EVENT_TYPES[:blocked_shot]
      zone_from_code(event)
    end
  end

  def zone_from_coords(x_coord, home_team_defending_side)
    return :neutral if x_coord.abs <= NEUTRAL_ZONE_MAX_ABS_X

    attacking_sign = home_team_defending_side == GameEvent::DEFENDING_SIDES[:left] ? 1 : -1
    (x_coord <=> 0) == attacking_sign ? :offensive : :defensive
  end

  # home_zone_for keeps blocked shots out: their event.zone is the blocker's frame, not
  # the shooter's, so mirroring by the event's own team would put them in the wrong zone.
  def zone_from_code(event)
    key = GameEvent::ZONES.key(event.zone)
    return :neutral if key == :neutral
    return key if event.team_id == game.home_team_id

    mirror_zone(key)
  end

  def mirror_zone(zone)
    return zone if zone == :neutral

    zone == :offensive ? :defensive : :offensive
  end
end
