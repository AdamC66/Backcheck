# Batches one recompute per distinct (player, team, game_type) combo touched across
# a bulk sync, instead of once per game (TASK-88).
class RecomputeTouchedSeasonStats
  attr_reader :failures

  def initialize(season:)
    @season = season
    @touched = Set.new
    @failures = []
  end

  def track(stat, game_type)
    touched << [ stat.player_id, stat.team_id, game_type ]
  end

  # Each combo rescued individually (TASK-104), so one bad player/team can't crash
  # the whole batch.
  def call
    players = Player.where(id: touched.map { |t| t[0] }).index_by(&:id)
    teams = Team.where(id: touched.map { |t| t[1] }).index_by(&:id)

    touched.each do |player_id, team_id, game_type|
      RecomputeSeasonStats.new(player: players.fetch(player_id), team: teams.fetch(team_id),
                                season: season, game_type: game_type).call
    rescue StandardError => e
      failures << "player=#{player_id} team=#{team_id} game_type=#{game_type}: #{e.message}"
    end
  end

  private

  attr_reader :season, :touched
end
