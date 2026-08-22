namespace :nhl do
  desc "Backfill NHL seasons, end-of-season standings, and schedules. Usage: rake 'nhl:backfill[20242025,20252026]'"
  task :backfill, [ :season_ids ] => :environment do |_task, args|
    league = League.find_by!(slug: "nhl")
    # Rake splits bracketed arguments on commas, so a list arrives as separate values.
    requested = args.to_a.flat_map { |value| value.to_s.split(/[,\s]+/) }.map(&:to_i).reject(&:zero?)
    abort("Pass at least one season, e.g. rake 'nhl:backfill[20252026]'") if requested.empty?

    puts "Seasons…"
    seasons = SyncSeasons.new(league: league, nhl_season_ids: requested).call
    seasons.each { |season| puts "  #{season.label} (#{season.starts_on}..#{season.ends_on})" }

    seasons.each do |season|
      # Completed seasons get one final snapshot; the live one is the daily job's job.
      if season.ends_on.past?
        puts "Standings #{season.label} (final, #{season.ends_on})…"
        sync = SyncStandings.new(league: league, date: season.ends_on)
        puts "  #{sync.call.size} teams"
        warn("  no team for #{sync.missing_teams.join(', ')}") if sync.missing_teams.any?
      else
        puts "Standings #{season.label}: skipped, season ends #{season.ends_on}"
      end

      next if season.starts_on.future?

      puts "Schedules #{season.label} (#{league.teams.count} teams, one request each)…"
      missing = []
      league.teams.alphabetical.each do |team|
        sync = SyncTeamSchedule.new(team: team, season: season)
        games = sync.call
        missing.concat(sync.missing_teams)
        print "  #{team.abbreviation}:#{games.size}"
      end
      puts
      warn("  no team for #{missing.uniq.join(', ')}") if missing.any?
    end

    puts "Done. #{Game.count} games, #{TeamStanding.count} standings rows."
  end
end
