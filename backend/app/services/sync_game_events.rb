# Ingests a game's play-by-play/shift-chart data, computes advanced stats, then hands
# off to the same MarkGameForStatsRecompute path a manual correction uses — one entry point.
class SyncGameEvents
  attr_reader :missing_players

  # recompute_inline: true for a bulk sync — see MarkGameForStatsRecompute (TASK-93).
  def initialize(game:, client: NhlClient.new, stats_client: NhlStatsClient.new, recompute_inline: false)
    @game = game
    @client = client
    @stats_client = stats_client
    @recompute_inline = recompute_inline
    @missing_players = []
  end

  def call
    events = upsert_events
    shifts = upsert_shifts

    ComputeGameAdvancedStats.new(game: game).call
    MarkGameForStatsRecompute.new(game: game, inline: recompute_inline).call
    RecomputeGoalieGamePoints.new(game: game).call

    events + shifts
  end

  private

  attr_reader :game, :client, :stats_client, :recompute_inline

  def upsert_events
    payload = client.play_by_play(game.nhl_game_id)
    upsert = UpsertGameEvents.new(game: game, payload: payload)
    events = upsert.call
    missing_players.concat(upsert.missing_players)
    events
  end

  def upsert_shifts
    payload = stats_client.shift_chart(game.nhl_game_id)
    upsert = UpsertShifts.new(game: game, payload: payload)
    shifts = upsert.call
    missing_players.concat(upsert.missing_players)
    shifts
  end
end
