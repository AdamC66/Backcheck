# Batches season-chain rebuilds for a bulk advanced_stats sync (TASK-94): instead of
# rebuilding per game — which let ingestion race ahead of a lagging recompute queue
# and balloon each rebuild's tail (TASK-93) — track which players/teams a run
# touches, then rebuild each one's chain once ingestion is fully done.
class RebuildTouchedAdvancedStatsChains
  attr_reader :failures

  def initialize(season:)
    @season = season
    @player_ids = Set.new
    @team_ids = Set.new
    @game_ids = Set.new
    @failures = []
  end

  def track(game)
    game_ids << game.id
    player_ids.merge(PlayerGameAdvancedStat.where(game: game).distinct.pluck(:player_id))
    team_ids << game.home_team_id << game.away_team_id
  end

  # Each player/team rescued individually (TASK-104) — one bad row used to abort the
  # whole batch uncaught, which also meant Game#stats_syncing below never got reset.
  def call
    players = Player.where(id: player_ids).index_by(&:id)
    player_ids.each do |player_id|
      rebuild_player(players.fetch(player_id))
    rescue StandardError => e
      failures << "player=#{player_id}: #{e.message}"
    end

    teams = Team.where(id: team_ids).index_by(&:id)
    team_ids.each do |team_id|
      RecomputeTeamSeasonAdvancedStats.new(team: teams.fetch(team_id), season: season).call
    rescue StandardError => e
      failures << "team=#{team_id}: #{e.message}"
    end

    Game.where(id: game_ids).update_all(stats_syncing: false)
  end

  private

  attr_reader :season, :player_ids, :team_ids, :game_ids

  def rebuild_player(player)
    dimension_start_games(player).each do |from_game|
      RebuildPlayerAdvancedStatsChain.new(player: player, from_game: from_game).call
    end
  end

  # Each dimension's own true earliest game for the season, not just the earliest
  # game this run happened to touch first — a dimension that only first appears
  # partway through the season (a skater's first power-play shift, say) still needs
  # its own anchor, or that dimension's chain would never get built at all.
  #
  # Also scoped per game_type, not just strength_state/score_state — preseason,
  # regular-season, and playoff games all share one season_id, so without this a
  # player with any preseason rows anchored every dimension at their (chronologically
  # earliest) preseason game, silently rebuilding only a preseason chain and never
  # touching the real regular-season/playoff ones at all (found live, TASK-105).
  def dimension_start_games(player)
    season_rows = PlayerGameAdvancedStat.where(player: player).joins(:game).merge(Game.for_season(season))
    dimensions = season_rows.distinct.pluck("games.game_type", :strength_state, :score_state)

    dimensions.filter_map do |game_type, strength_state, score_state|
      season_rows.where(strength_state: strength_state, score_state: score_state, games: { game_type: game_type })
                 .order("games.starts_at").first&.game
    end.uniq
  end
end
