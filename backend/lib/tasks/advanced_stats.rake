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
end
