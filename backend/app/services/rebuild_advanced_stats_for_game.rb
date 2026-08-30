# The heavy-lifting half of a stats correction, run from RebuildAdvancedStatsJob.
# Assumes player_game_advanced_stats/team_game_advanced_stats for this game are already
# fresh (populated by whatever ingestion/computation writes them) — this rebuilds the
# season-grain rollups that chain or aggregate off those per-game rows.
class RebuildAdvancedStatsForGame
  def initialize(game:)
    @game = game
  end

  def call
    affected_players.each { |player| RebuildPlayerAdvancedStatsChain.new(player: player, from_game: game).call }
    [ game.home_team, game.away_team ].each do |team|
      RecomputeTeamSeasonAdvancedStats.new(team: team, season: game.season).call
    end
    rebuild_zone_time_rollups
    game.update!(stats_syncing: false)
  end

  private

  attr_reader :game

  def affected_players
    Player.where(id: PlayerGameAdvancedStat.where(game: game).select(:player_id).distinct)
  end

  def rebuild_zone_time_rollups
    PlayerGameZoneTime.where(game: game).includes(:player, :team).find_each do |row|
      RecomputeSeasonZoneTime.new(player: row.player, team: row.team, season: game.season,
                                  game_type: game.game_type).call
    end
  end
end
