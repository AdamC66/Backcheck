# Called after game_events change (SyncGameEvents), since a goalie's goals/assists can
# only be derived once play-by-play exists — a game_stats-only sync leaves them at 0.
class RecomputeGoalieGamePoints
  def initialize(game:)
    @game = game
  end

  def call
    GoalieGameStat.where(game: game).find_each do |stat|
      points = GoalieGamePoints.new(game: game, player: stat.player)
      stat.update!(goals: points.goals, assists: points.assists)

      RecomputeSeasonStats.new(player: stat.player, team: stat.team, season: game.season,
                                game_type: game.game_type).call
    end
  end

  private

  attr_reader :game
end
