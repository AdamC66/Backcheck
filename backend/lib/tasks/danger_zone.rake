# Proves DangerZone's boundaries (TASK-106) against ingested shots. Re-runnable, no NHL API call.
namespace :danger_zone do
  desc "Classify already-ingested shot events against DangerZone's boundaries and print a validation report"
  task validate: :environment do
    shot_event_types = GameEvent::EVENT_TYPES.values_at(:goal, :shot, :missed_shot)
    games = Game.where(id: GameEvent.select(:game_id).distinct).includes(:home_team, :away_team)
    abort("No games have stored game_events yet — nothing to validate.") if games.none?

    counts = Hash.new(0)
    goal_counts = Hash.new(0)
    high_danger_goals = []
    long_range_shots = []
    sharp_angle_close_goals = []

    games.find_each do |game|
      matchup = "#{game.away_team.abbreviation} @ #{game.home_team.abbreviation}"
      events = GameEvent.where(game: game, event_type: shot_event_types)
                        .where.not(x_coord: nil).where.not(y_coord: nil)
                        .where.not(team_id: nil).where.not(home_team_defending_side: nil)
                        .preload(:game)
      events.each do |event|
        geometry = ShotGeometry.new(x_coord: event.x_coord, y_coord: event.y_coord, target_net_x: event.target_net_x)
        bucket = DangerZone.classify(x_coord: event.x_coord, y_coord: event.y_coord, target_net_x: event.target_net_x)
        counts[bucket] += 1

        next unless event.event_type == GameEvent::EVENT_TYPES[:goal]

        goal_counts[bucket] += 1
        distance = geometry.distance
        row = { game: matchup, x: geometry.offensive_x, y: geometry.offensive_y, dist: distance.round(1) }
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
