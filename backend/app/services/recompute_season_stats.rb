# Re-sums *_game_stats from scratch rather than incrementing in place — cheap (bounded
# by one team-stint's games) and immune to drift from a corrected boxscore. See docs/DECISIONS.md.
class RecomputeSeasonStats
  def initialize(player:, team:, season:, game_type:)
    @player = player
    @team = team
    @season = season
    @game_type = game_type
  end

  def call
    upsert_skater
    upsert_goalie
  end

  private

  attr_reader :player, :team, :season, :game_type

  def games
    Game.for_season(season).where(game_type: game_type).for_team(team)
  end

  def upsert_skater
    rows = SkaterGameStat.where(player: player, team: team, game: games)
    scope = SkaterSeasonStat.where(player: player, team: team, season: season, game_type: game_type)
    return scope.destroy_all if rows.none?

    scope.first_or_initialize.update!(
      games_played: rows.count,
      goals: rows.sum(:goals),
      assists: rows.sum(:assists),
      points: rows.sum(:points),
      plus_minus: rows.sum(:plus_minus),
      pim: rows.sum(:pim),
      hits: rows.sum(:hits),
      power_play_goals: rows.sum(:power_play_goals),
      shots_on_goal: rows.sum(:shots_on_goal),
      faceoff_winning_pctg: rows.average(:faceoff_winning_pctg),
      time_on_ice_seconds: rows.sum(:time_on_ice_seconds),
      shifts: rows.sum(:shifts),
      blocked_shots: rows.sum(:blocked_shots),
      giveaways: rows.sum(:giveaways),
      takeaways: rows.sum(:takeaways)
    )
  end

  def upsert_goalie
    rows = GoalieGameStat.where(player: player, team: team, game: games)
    scope = GoalieSeasonStat.where(player: player, team: team, season: season, game_type: game_type)
    return scope.destroy_all if rows.none?

    scope.first_or_initialize.update!(
      games_played: rows.count,
      games_started: rows.where(starter: true).count,
      wins: rows.where(decision: GoalieGameStat::DECISIONS[:win]).count,
      losses: rows.where(decision: GoalieGameStat::DECISIONS[:loss]).count,
      ot_losses: rows.where(decision: GoalieGameStat::DECISIONS[:ot_loss]).count,
      shutouts: rows.where(goals_against: 0).where.not(decision: nil).count,
      even_strength_shots_against: rows.sum(:even_strength_shots_against),
      even_strength_goals_against: rows.sum(:even_strength_goals_against),
      power_play_shots_against: rows.sum(:power_play_shots_against),
      power_play_goals_against: rows.sum(:power_play_goals_against),
      shorthanded_shots_against: rows.sum(:shorthanded_shots_against),
      shorthanded_goals_against: rows.sum(:shorthanded_goals_against),
      shots_against: rows.sum(:shots_against),
      saves: rows.sum(:saves),
      goals_against: rows.sum(:goals_against),
      pim: rows.sum(:pim),
      time_on_ice_seconds: rows.sum(:time_on_ice_seconds)
    )
  end
end
