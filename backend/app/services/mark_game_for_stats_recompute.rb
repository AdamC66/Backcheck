# Entry point for "corrected data arrived for this game": flags the affected rows
# immediately (synchronously) and hands the actual rebuild to a background job, so
# stats_syncing/stale are visible right away even before the ingest queue gets to it.
#
# inline: true runs the rebuild in-process instead of enqueuing it — for a bulk sync
# (already running off the web request inside its own background job), enqueuing lets
# ingestion race arbitrarily far ahead of the single-threaded ingest queue, so a
# delayed rebuild sweeps a much bigger tail than the one new row it actually needs.
# Running inline keeps ingestion and recompute paced 1:1, so it can never fall behind
# (TASK-93). The single-game/live-correction path keeps the async default.
class MarkGameForStatsRecompute
  def initialize(game:, inline: false)
    @game = game
    @inline = inline
  end

  def call
    game.update!(stats_syncing: true)
    PlayerSeasonAdvancedStat.where(player_id: affected_player_ids)
                            .joins(:as_of_game).where("games.starts_at >= ?", game.starts_at)
                            .update_all(stale: true)
    inline ? RebuildAdvancedStatsForGame.new(game: game).call : RebuildAdvancedStatsJob.perform_later(game.id)
  end

  private

  attr_reader :game, :inline

  def affected_player_ids
    PlayerGameAdvancedStat.where(game: game).distinct.pluck(:player_id)
  end
end
