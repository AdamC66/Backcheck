# Proves DangerZone's boundaries (TASK-106) against ingested shots before anything downstream
# consumes them. The draft classifier lives here until TASK-107 adds DangerZone.classify.
module DangerZoneValidation
  module_function

  def shot_event_types
    GameEvent::EVENT_TYPES.values_at(:goal, :shot, :missed_shot)
  end

  def in_high_danger_polygon?(x, y)
    poly = DangerZone::HIGH_DANGER_POLYGON
    inside = false
    j = poly.length - 1
    poly.each_index do |i|
      xi, yi = poly[i]
      xj, yj = poly[j]
      inside = !inside if (yi > y) != (yj > y) && x < (((xj - xi) * (y - yi) / (yj - yi).to_f) + xi)
      j = i
    end
    inside
  end

  # Net resolution matches ComputeGameAdvancedStats#target_net_x_for; TASK-107 extracts the shared step.
  def normalized_shot(event, game)
    home_net_x = event.home_team_defending_side == GameEvent::DEFENDING_SIDES[:left] ? -DangerZone::GOAL_LINE_X : DangerZone::GOAL_LINE_X
    target_net_x = event.team_id == game.home_team_id ? -home_net_x : home_net_x

    x = target_net_x.negative? ? -event.x_coord : event.x_coord
    y = target_net_x.negative? ? -event.y_coord : event.y_coord
    distance = Math.sqrt(((DangerZone::GOAL_LINE_X - x)**2) + (y**2))
    [ x, y, distance ]
  end

  def classify(x, y, distance)
    return :high_danger if distance <= DangerZone::HIGH_DANGER_CREASE_RADIUS_FT
    return :high_danger if in_high_danger_polygon?(x, y)
    return :mid_range if distance <= DangerZone::MID_RANGE_MAX_DISTANCE_FT

    :long_range
  end
end

namespace :danger_zone do
  desc "Classify already-ingested shot events against DangerZone's boundaries and print a validation report"
  task validate: :environment do
    v = DangerZoneValidation
    games = Game.where(id: GameEvent.select(:game_id).distinct).includes(:home_team, :away_team)
    abort("No games have stored game_events yet — nothing to validate.") if games.none?

    counts = Hash.new(0)
    goal_counts = Hash.new(0)
    high_danger_goals = []
    long_range_shots = []
    sharp_angle_close_goals = []

    games.find_each do |game|
      matchup = "#{game.away_team.abbreviation} @ #{game.home_team.abbreviation}"
      events = GameEvent.where(game: game, event_type: v.shot_event_types)
                        .where.not(x_coord: nil).where.not(y_coord: nil)
                        .where.not(team_id: nil).where.not(home_team_defending_side: nil)
      events.each do |event|
        x, y, distance = v.normalized_shot(event, game)
        bucket = v.classify(x, y, distance)
        counts[bucket] += 1

        next unless event.event_type == GameEvent::EVENT_TYPES[:goal]

        goal_counts[bucket] += 1
        row = { game: matchup, x: x.round, y: y.round, dist: distance.round(1) }
        high_danger_goals << row if bucket == :high_danger
        long_range_shots << row if bucket == :long_range
        sharp_angle_close_goals << row.merge(bucket: bucket) if distance < 15 && bucket != :high_danger
      end
    end

    total = counts.values.sum
    goal_total = goal_counts.values.sum
    puts "\n#{total} shot events (#{goal_total} goals) across #{games.count} game(s)"
    puts "  bucket        shots            goals"
    %i[high_danger mid_range long_range].each do |bucket|
      s = "#{counts[bucket]} (#{(100.0 * counts[bucket] / total).round(1)}%)"
      g = "#{goal_counts[bucket]} (#{(100.0 * goal_counts[bucket] / goal_total).round(1)}%)"
      puts "  #{bucket.to_s.ljust(12)}  #{s.ljust(16)} #{g}"
    end

    puts "\nSample high-danger goals (AC: close, in-slot goals land here):"
    high_danger_goals.sample(10).each { |r| puts "  #{r[:game]}  (#{r[:x]}, #{r[:y]})  #{r[:dist]}ft" }

    puts "\nSample long-range shots (AC: point shots land here):"
    long_range_shots.sample(10).each { |r| puts "  #{r[:game]}  (#{r[:x]}, #{r[:y]})  #{r[:dist]}ft" }

    # Not a failure: the home-plate polygon deliberately excludes sharp-angle shots near the goal line.
    pct = (100.0 * sharp_angle_close_goals.size / goal_total).round(1)
    puts "\nSharp-angle goals within 15ft classified below high-danger: #{sharp_angle_close_goals.size} (#{pct}% of goals)"
    sharp_angle_close_goals.sample(8).each { |r| puts "  #{r[:game]}  (#{r[:x]}, #{r[:y]})  #{r[:dist]}ft  -> #{r[:bucket]}" }
  end
end
