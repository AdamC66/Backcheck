# Called after game_events change (SyncGameEvents), since a goalie's goals/assists can
# only be derived once play-by-play exists — a game_stats-only sync leaves them at 0.
#
# recompute: :skip lets a bulk caller batch the season-stat rollup itself, once per
# distinct (player, team, game_type) instead of once per game (TASK-102).
class RecomputeGoalieGamePoints
  def initialize(game:, recompute: :async)
    @game = game
    @recompute = recompute
  end

  def call
    GoalieGameStat.where(game: game).to_a.each do |stat|
      points = GoalieGamePoints.new(game: game, player: stat.player)
      stat.update!(goals: points.goals, assists: points.assists)

      next if recompute == :skip

      RecomputeSeasonStats.new(player: stat.player, team: stat.team, season: game.season,
                                game_type: game.game_type).call
    end
  end

  private

  attr_reader :game, :recompute
end
