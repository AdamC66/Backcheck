class SyncGameStatsJob < ApplicationJob
  queue_as :ingest

  def perform(game_id)
    game = Game.find(game_id)
    sync = SyncGameStats.new(game: game)
    stats = sync.call

    Rails.logger.info("SyncGameStats game=#{game.id}: #{stats.size} stat lines")
    if sync.missing_players.any?
      Rails.logger.warn("SyncGameStats game=#{game.id}: no player for #{sync.missing_players.uniq.join(', ')}")
    end
  end
end
