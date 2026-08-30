class GameZoneTimeSerializer
  def initialize(game)
    @game = game
  end

  def as_json(*)
    { periods: periods, totals: totals, skaters: skaters }
  end

  private

  attr_reader :game

  def timeline
    @timeline ||= ZoneOccupancyTimeline.new(game)
  end

  def segments_by_period
    @segments_by_period ||= Shift.where(game: game).distinct.pluck(:period).sort
                                 .index_with { |period| timeline.segments(period) }
  end

  def periods
    segments_by_period.map do |period, segments|
      {
        period: period,
        length_seconds: segments.map(&:end_seconds).max || 0,
        segments: segments.map do |segment|
          { start_seconds: segment.start_seconds, end_seconds: segment.end_seconds, zone: segment.home_zone }
        end
      }
    end
  end

  def totals
    sums = { offensive: 0, neutral: 0, defensive: 0 }
    segments_by_period.each_value do |segments|
      segments.each { |segment| sums[segment.home_zone] += segment.end_seconds - segment.start_seconds }
    end
    { offensive_seconds: sums[:offensive], neutral_seconds: sums[:neutral], defensive_seconds: sums[:defensive] }
  end

  def skaters
    PlayerGameZoneTime.where(game: game).joins(:player).includes(:player)
                      .order("players.last_name, players.first_name").map do |row|
      {
        player: PlayerSerializer.new(row.player).as_json,
        team_id: row.team_id,
        starts: {
          offensive: row.offensive_starts, neutral: row.neutral_starts,
          defensive: row.defensive_starts, on_the_fly: row.on_the_fly_starts
        },
        seconds: {
          offensive: row.offensive_seconds, neutral: row.neutral_seconds, defensive: row.defensive_seconds
        }
      }
    end
  end
end
