# Ingests a game's play-by-play/shift-chart data, computes advanced stats, then hands
# off to the same MarkGameForStatsRecompute path a manual correction uses — one entry point.
class SyncGameEvents
  # goalie_stats: the GoalieGameStat rows RecomputeGoalieGamePoints touched — a bulk
  # caller batches their season-stat recompute the same way SyncGameStats' rows are
  # (TASK-102), rather than reading it off #call's own return value.
  attr_reader :missing_players, :goalie_stats

  # recompute: :skip for a bulk sync — see MarkGameForStatsRecompute (TASK-94) and
  # RecomputeGoalieGamePoints (TASK-102).
  def initialize(game:, client: NhlClient.new, stats_client: NhlStatsClient.new, recompute: :async)
    @game = game
    @client = client
    @stats_client = stats_client
    @recompute = recompute
    @missing_players = []
    @goalie_stats = []
  end

  def call
    events = upsert_events
    shifts = upsert_shifts

    ComputeGameAdvancedStats.new(game: game).call
    MarkGameForStatsRecompute.new(game: game, mode: recompute).call
    @goalie_stats = RecomputeGoalieGamePoints.new(game: game, recompute: recompute).call

    events + shifts
  end

  private

  attr_reader :game, :client, :stats_client, :recompute

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
