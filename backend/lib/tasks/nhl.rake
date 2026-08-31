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

      # No future-season guard: the NHL publishes a full schedule in the offseason, and
      # an all-FUT season is exactly what speculative lineup planning needs.
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

  desc "Backfill game stats for one team's season (one boxscore request per game). " \
       "Usage: rake 'nhl:backfill_game_stats[TOR,20242025]'"
  task :backfill_game_stats, [ :team_abbreviation, :nhl_season_id ] => :environment do |_task, args|
    abbreviation = args[:team_abbreviation]
    nhl_season_id = args[:nhl_season_id].to_i
    abort("Usage: rake 'nhl:backfill_game_stats[TOR,20242025]'") if abbreviation.blank? || nhl_season_id.zero?

    league = League.find_by!(slug: "nhl")
    team = league.teams.find_by!(abbreviation: abbreviation)
    season = league.seasons.find_by!(nhl_season_id: nhl_season_id)

    games = Game.for_team(team).for_season(season).finished.chronological
    abort("No finished games for #{team.abbreviation} in #{season.label} — run nhl:backfill first") if games.none?

    puts "#{team.abbreviation} #{season.label}: #{games.size} finished games"

    missing_players = []
    # Batches season-stat recompute once per distinct player/team across the whole
    # backfill instead of once per game (TASK-88).
    recompute_batch = RecomputeTouchedSeasonStats.new(season: season)
    games.each do |game|
      sync = SyncGameStats.new(game: game, recompute: false)
      stats = sync.call
      stats.each { |stat| recompute_batch.track(stat, game.game_type) }
      missing_players.concat(sync.missing_players)
      print "."
    rescue NhlClient::Error => e
      warn "\n  #{game.nhl_game_id} (#{game.game_date}) failed: #{e.message}"
    end
    puts
    recompute_batch.call

    warn("  no player for #{missing_players.uniq.sort.join(', ')}") if missing_players.any?
    puts "Done. #{SkaterGameStat.joins(:game).merge(games).count} skater rows, " \
         "#{GoalieGameStat.joins(:game).merge(games).count} goalie rows."
  end
end
