# Called after game_events change (SyncGameEvents), since a goalie's goals/assists can
# only be derived once play-by-play exists — a game_stats-only sync leaves them at 0.
#
# recompute: :skip for a bulk sync — updates each goalie's own goals/assists but defers
# the season-stat rollup to the caller's own batch (TASK-102, mirrors TASK-88): this used
# to call RecomputeSeasonStats inline per goalie per game, so a full-season advanced_stats
# sync recomputed the same goalie's season totals once per game instead of once per
# distinct (player, team, game_type). Returns the touched GoalieGameStat rows either way,
# so a bulk caller can batch them the same way SyncGameStats' rows already are.
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
