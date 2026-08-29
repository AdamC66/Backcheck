# Batches season-chain rebuilds for a bulk advanced_stats sync (TASK-94): instead of
# rebuilding per game — which let ingestion race ahead of a lagging recompute queue
# and balloon each rebuild's tail (TASK-93) — track which players/teams a run
# touches, then rebuild each one's chain once ingestion is fully done.
class RebuildTouchedAdvancedStatsChains
  def initialize(season:)
    @season = season
    @player_ids = Set.new
    @team_ids = Set.new
    @game_ids = Set.new
  end

  def track(game)
    game_ids << game.id
    player_ids.merge(PlayerGameAdvancedStat.where(game: game).distinct.pluck(:player_id))
    team_ids << game.home_team_id << game.away_team_id
  end

  def call
    players = Player.where(id: player_ids).index_by(&:id)
    player_ids.each { |player_id| rebuild_player(players.fetch(player_id)) }

    teams = Team.where(id: team_ids).index_by(&:id)
    team_ids.each { |team_id| RecomputeTeamSeasonAdvancedStats.new(team: teams.fetch(team_id), season: season).call }

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
  def dimension_start_games(player)
    season_rows = PlayerGameAdvancedStat.where(player: player).joins(:game).merge(Game.for_season(season))
    dimensions = season_rows.distinct.pluck(:strength_state, :score_state)

    dimensions.filter_map do |strength_state, score_state|
      season_rows.where(strength_state: strength_state, score_state: score_state)
                 .order("games.starts_at").first&.game
    end.uniq
  end
end
