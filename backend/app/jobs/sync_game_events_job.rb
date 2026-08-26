class SyncGameEventsJob < ApplicationJob
  queue_as :ingest

  def perform(game_id)
    game = Game.find(game_id)
    sync = SyncGameEvents.new(game: game)
    rows = sync.call

    Rails.logger.info("SyncGameEvents game=#{game.id}: #{rows.size} event/shift rows")
    if sync.missing_players.any?
      Rails.logger.warn("SyncGameEvents game=#{game.id}: no player for #{sync.missing_players.uniq.join(', ')}")
    end
  end
end
