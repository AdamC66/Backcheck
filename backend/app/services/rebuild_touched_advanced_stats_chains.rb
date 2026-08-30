# Batches season-chain rebuilds for a bulk sync (TASK-94): tracks which players/teams
# a run touches, then rebuilds each one's chain once ingestion is fully done.
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

  # Each player/team rescued individually (TASK-104), so one bad row can't abort
  # the whole batch or leave Game#stats_syncing below stuck true.
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

    rebuild_zone_time_rollups

    Game.where(id: game_ids).update_all(stats_syncing: false)
  end

  private

  attr_reader :season, :player_ids, :team_ids, :game_ids

  def rebuild_zone_time_rollups
    game_types = Game.where(id: game_ids).pluck(:id, :game_type).to_h
    stints = PlayerGameZoneTime.where(game_id: game_ids).distinct.pluck(:player_id, :team_id, :game_id)
                               .map { |player_id, team_id, game_id| [ player_id, team_id, game_types.fetch(game_id) ] }
                               .uniq
    players = Player.where(id: stints.map(&:first)).index_by(&:id)
    teams = Team.where(id: stints.map { |stint| stint[1] }).index_by(&:id)

    stints.each do |player_id, team_id, game_type|
      RecomputeSeasonZoneTime.new(player: players.fetch(player_id), team: teams.fetch(team_id),
                                  season: season, game_type: game_type).call
    rescue StandardError => e
      failures << "zone_time player=#{player_id} team=#{team_id}: #{e.message}"
    end
  end

  def rebuild_player(player)
    dimension_start_games(player).each do |from_game|
      RebuildPlayerAdvancedStatsChain.new(player: player, from_game: from_game).call
    end
  end

  # Anchored per (game_type, strength_state, score_state), not just the earliest game
  # this run touched — preseason/regular/playoff games share one season_id (TASK-105).
  def dimension_start_games(player)
    season_rows = PlayerGameAdvancedStat.where(player: player).joins(:game).merge(Game.for_season(season))
    dimensions = season_rows.distinct.pluck("games.game_type", :strength_state, :score_state)

    dimensions.filter_map do |game_type, strength_state, score_state|
      season_rows.where(strength_state: strength_state, score_state: score_state, games: { game_type: game_type })
                 .order("games.starts_at").first&.game
    end.uniq
  end
end
