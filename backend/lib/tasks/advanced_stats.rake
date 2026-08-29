namespace :advanced_stats do
  desc "Backfill player/team advanced stats, including score-state splits, for every game with " \
       "stored game_events. No NHL API call — recomputes from what's already ingested. " \
       "Usage: rake advanced_stats:backfill"
  task backfill: :environment do
    games = Game.where(id: GameEvent.select(:game_id).distinct)
    abort("No games have stored game_events yet — nothing to backfill.") if games.none?

    count = 0
    games.find_each do |game|
      ComputeGameAdvancedStats.new(game: game).call
      RebuildAdvancedStatsForGame.new(game: game).call
      count += 1
      print "."
    end
    puts
    puts "Done. #{count} game(s) recomputed."
  end

  desc "Rebuild season-level advanced stats (PlayerSeasonAdvancedStat/TeamSeasonAdvancedStat), plus the " \
       "individual counting stats (faceoff W/L, shots attempted/missed/blocked), for every already-ingested " \
       "game in one season — no NHL API call, one rebuild per player/team for the whole season instead of " \
       "once per game (TASK-94/104's batching, TASK-105). " \
       "Usage: rake 'advanced_stats:rebuild_season[nhl,2024-25]'"
  task :rebuild_season, [ :league_slug, :season_label ] => :environment do |_task, args|
    league = League.find_by!(slug: args[:league_slug])
    season = league.seasons.find_by!(label: args[:season_label])

    games = Game.for_season(season).finished.joins(:player_game_advanced_stats).distinct
    abort("No games with advanced stats for #{league.name} #{season.label} — nothing to rebuild.") if games.none?

    chain_batch = RebuildTouchedAdvancedStatsChains.new(season: season)
    season_batch = RecomputeTouchedSeasonStats.new(season: season)

    games.find_each do |game|
      stats = ComputeIndividualGameStats.new(game: game, recompute: :skip).call
      stats.each { |stat| season_batch.track(stat, game.game_type) }
      chain_batch.track(game)
      print "."
    end
    puts
    chain_batch.call
    season_batch.call

    failures = chain_batch.failures + season_batch.failures
    if failures.any?
      puts "#{failures.size} failure(s):"
      failures.each { |failure| puts "  #{failure}" }
    end
    puts "Done. #{games.count} game(s) touched."
  end
end
