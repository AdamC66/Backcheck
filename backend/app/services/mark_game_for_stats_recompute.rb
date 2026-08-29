# Entry point for "corrected data arrived for this game": flags the affected rows
# immediately (synchronously) and hands the actual rebuild to a background job, so
# stats_syncing/stale are visible right away even before the ingest queue gets to it.
#
# mode: :skip defers the whole rebuild (no stale-marking, no job) to a single
# end-of-run batch pass instead — a bulk sync's mid-backfill has nothing built yet (TASK-94).
class MarkGameForStatsRecompute
  def initialize(game:, mode: :async)
    @game = game
    @mode = mode
  end

  def call
    return if mode == :skip

    game.update!(stats_syncing: true)
    # Scoped to game's own season, or a player's already-correct rows in another
    # season get spuriously marked stale too (TASK-94).
    PlayerSeasonAdvancedStat.where(player_id: affected_player_ids)
                            .joins(:as_of_game).where(games: { season_id: game.season_id })
                            .where("games.starts_at >= ?", game.starts_at)
                            .update_all(stale: true)
    RebuildAdvancedStatsJob.perform_later(game.id)
  end

  private

  attr_reader :game, :mode

  def affected_player_ids
    PlayerGameAdvancedStat.where(game: game).distinct.pluck(:player_id)
  end
end
