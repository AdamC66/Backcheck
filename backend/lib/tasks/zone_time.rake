# Checks ZoneOccupancyTimeline / zone-start derivation (TASK-110/111) against ingested
# games. Re-runnable, no NHL API call, writes nothing. See docs/DECISIONS.md (TASK-112).
namespace :zone_time do
  desc "Compute and store player_game_zone_times for every game with stored game_events and " \
       "shifts. No NHL API call. Usage: rake zone_time:backfill"
  task backfill: :environment do
    games = Game.where(id: GameEvent.select(:game_id).distinct).where(id: Shift.select(:game_id).distinct)
    abort("No games have both game_events and shifts yet — nothing to backfill.") if games.none?

    count = 0
    games.find_each do |game|
      ComputeGameZoneTime.new(game: game).call
      count += 1
      print "."
    end
    puts
    puts "Done. #{count} game(s)."
  end

  desc "Derive zone time + zone starts from already-ingested games and print a validation report"
  task validate: :environment do
    games = Game.where(id: GameEvent.select(:game_id).distinct)
                .where(id: Shift.select(:game_id).distinct)
                .includes(:home_team, :away_team)
    abort("No games have both game_events and shifts yet — nothing to validate.") if games.none?

    limit = ENV["LIMIT"]&.to_i
    scope = limit ? games.order("RANDOM()").limit(limit) : games

    starts = Hash.new(0)
    seconds = Hash.new(0)
    covered_shift_seconds = 0
    uncovered_shift_seconds = 0
    sum_mismatches = 0
    shift_count = 0
    dz_start_offensive_share = []
    oz_start_defensive_share = []
    game_count = 0

    scope.find_each do |game|
      timeline = ZoneOccupancyTimeline.new(game)
      faceoffs = GameEvent.where(game: game, event_type: GameEvent::EVENT_TYPES[:faceoff]).to_a.group_by(&:period)
      shifts = Shift.where(game: game).includes(:player).reject { |s| s.player.position == Player::POSITIONS[:goalie] }
      next if shifts.empty?

      game_count += 1
      per_player_game = Hash.new { |h, k| h[k] = { zone: 0, shift: 0 } }

      shifts.each do |shift|
        shift_count += 1
        length = shift.end_time_seconds - shift.start_time_seconds
        covered = timeline.segments(shift.period).any?
        covered ? (covered_shift_seconds += length) : (uncovered_shift_seconds += length)

        durations = timeline.zone_durations(period: shift.period, from_seconds: shift.start_time_seconds,
                                            to_seconds: shift.end_time_seconds, team_id: shift.team_id)
        durations.each { |zone, secs| seconds[zone] += secs }

        if covered
          per_player_game[shift.player_id][:zone] += durations.values.sum
          per_player_game[shift.player_id][:shift] += length
        end

        start_zone = start_zone_for(timeline, faceoffs[shift.period], shift)
        starts[start_zone || :on_the_fly] += 1

        total = durations.values.sum
        next if total.zero?

        dz_start_offensive_share << (durations[:offensive].to_f / total) if start_zone == :defensive
        oz_start_defensive_share << (durations[:defensive].to_f / total) if start_zone == :offensive
      end

      per_player_game.each_value { |v| sum_mismatches += 1 if (v[:zone] - v[:shift]).abs > 2 }
    end

    report(game_count, shift_count, starts, seconds, covered_shift_seconds, uncovered_shift_seconds,
           sum_mismatches, dz_start_offensive_share, oz_start_defensive_share)
  end

  def start_zone_for(timeline, period_faceoffs, shift)
    faceoff = (period_faceoffs || []).find do |event|
      (event.period_time_seconds - shift.start_time_seconds).abs <= ComputeGameZoneTime::START_FACEOFF_WINDOW_SECONDS
    end
    return if faceoff.nil?

    timeline.puck_zone_for(faceoff, team_id: shift.team_id)
  end

  def report(games, shifts, starts, seconds, covered, uncovered, mismatches, dz_off, oz_def)
    start_total = starts.values.sum
    puts "\n#{shifts} skater shifts across #{games} game(s)"

    puts "\nZone starts:"
    %i[offensive neutral defensive on_the_fly].each do |key|
      puts "  #{key.to_s.ljust(12)} #{pct(starts[key], start_total)}"
    end
    faceoff_total = start_total - starts[:on_the_fly]
    puts "  faceoff-anchored only:  " +
      %i[offensive neutral defensive].map { |k| "#{k} #{pct(starts[k], faceoff_total)}" }.join("   ")

    sec_total = seconds.values.sum
    puts "\nZone time (forward-fill proxy):"
    %i[offensive neutral defensive].each { |k| puts "  #{k.to_s.ljust(12)} #{pct(seconds[k], sec_total)}" }

    puts "\nShift-second coverage (period has a derived timeline):"
    puts "  covered   #{pct(covered, covered + uncovered)}"
    puts "  no data   #{pct(uncovered, covered + uncovered)}"

    puts "\nPer player-game sum integrity (|Σzone − Σshift| > 2s over covered periods): #{mismatches}"

    puts "\nTransition sensitivity (proxy is not just echoing the start faceoff):"
    puts "  DZ-faceoff-start shifts: mean #{mean_pct(dz_off)} of time in the offensive zone (n=#{dz_off.size})"
    puts "  OZ-faceoff-start shifts: mean #{mean_pct(oz_def)} of time in the defensive zone (n=#{oz_def.size})"
  end

  def pct(part, whole)
    return "0 (0.0%)" if whole.zero?

    "#{part} (#{(100.0 * part / whole).round(1)}%)"
  end

  def mean_pct(values)
    return "n/a" if values.empty?

    "#{(100.0 * values.sum / values.size).round(1)}%"
  end
end
