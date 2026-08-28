# Bulk syncs touch the same (player, team, game_type) combo across many games —
# batching to one recompute per distinct combo instead of one per game avoids
# ~46x redundant RecomputeSeasonStats calls on a full-season backfill (TASK-88).
class RecomputeTouchedSeasonStats
  def initialize(season:)
    @season = season
    @touched = Set.new
  end

  def track(stat, game_type)
    touched << [ stat.player_id, stat.team_id, game_type ]
  end

  def call
    players = Player.where(id: touched.map { |t| t[0] }).index_by(&:id)
    teams = Team.where(id: touched.map { |t| t[1] }).index_by(&:id)

    touched.each do |player_id, team_id, game_type|
      RecomputeSeasonStats.new(player: players.fetch(player_id), team: teams.fetch(team_id),
                                season: season, game_type: game_type).call
    end
  end

  private

  attr_reader :season, :touched
end
