# Entry point for "corrected data arrived for this game": flags the affected rows
# immediately (synchronously) and hands the actual rebuild to a background job, so
# stats_syncing/stale are visible right away even before the ingest queue gets to it.
class MarkGameForStatsRecompute
  def initialize(game:)
    @game = game
  end

  def call
    game.update!(stats_syncing: true)
    PlayerSeasonAdvancedStat.where(player_id: affected_player_ids)
                            .joins(:as_of_game).where("games.starts_at >= ?", game.starts_at)
                            .update_all(stale: true)
    RebuildAdvancedStatsJob.perform_later(game.id)
  end

  private

  attr_reader :game

  def affected_player_ids
    PlayerGameAdvancedStat.where(game: game).distinct.pluck(:player_id)
  end
end
