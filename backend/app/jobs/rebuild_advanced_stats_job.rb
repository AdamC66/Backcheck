class RebuildAdvancedStatsJob < ApplicationJob
  queue_as :ingest

  def perform(game_id)
    RebuildAdvancedStatsForGame.new(game: Game.find(game_id)).call
  end
end
