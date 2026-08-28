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

  # One query for the rows, not one per column summed off them (see backend/CLAUDE.md).
  def upsert_skater
    rows = SkaterGameStat.where(player: player, team: team, game: games).to_a
    scope = SkaterSeasonStat.where(player: player, team: team, season: season, game_type: game_type)
    return scope.destroy_all if rows.empty?

    scope.first_or_initialize.update!(
      games_played: rows.size,
      goals: sum_of(rows, :goals),
      assists: sum_of(rows, :assists),
      points: sum_of(rows, :points),
      plus_minus: sum_of(rows, :plus_minus),
      pim: sum_of(rows, :pim),
      hits: sum_of(rows, :hits),
      power_play_goals: sum_of(rows, :power_play_goals),
      shots_on_goal: sum_of(rows, :shots_on_goal),
      faceoff_winning_pctg: average_of(rows, :faceoff_winning_pctg),
      time_on_ice_seconds: sum_of(rows, :time_on_ice_seconds),
      shifts: sum_of(rows, :shifts),
      blocked_shots: sum_of(rows, :blocked_shots),
      giveaways: sum_of(rows, :giveaways),
      takeaways: sum_of(rows, :takeaways)
    )
  end

  def upsert_goalie
    rows = GoalieGameStat.where(player: player, team: team, game: games).to_a
    scope = GoalieSeasonStat.where(player: player, team: team, season: season, game_type: game_type)
    return scope.destroy_all if rows.empty?

    scope.first_or_initialize.update!(
      games_played: rows.size,
      games_started: rows.count(&:starter),
      goals: sum_of(rows, :goals),
      assists: sum_of(rows, :assists),
      wins: rows.count { |row| row.decision == GoalieGameStat::DECISIONS[:win] },
      losses: rows.count { |row| row.decision == GoalieGameStat::DECISIONS[:loss] },
      ot_losses: rows.count { |row| row.decision == GoalieGameStat::DECISIONS[:ot_loss] },
      shutouts: rows.count { |row| row.goals_against.zero? && !row.decision.nil? },
      even_strength_shots_against: sum_of(rows, :even_strength_shots_against),
      even_strength_goals_against: sum_of(rows, :even_strength_goals_against),
      power_play_shots_against: sum_of(rows, :power_play_shots_against),
      power_play_goals_against: sum_of(rows, :power_play_goals_against),
      shorthanded_shots_against: sum_of(rows, :shorthanded_shots_against),
      shorthanded_goals_against: sum_of(rows, :shorthanded_goals_against),
      shots_against: sum_of(rows, :shots_against),
      saves: sum_of(rows, :saves),
      goals_against: sum_of(rows, :goals_against),
      pim: sum_of(rows, :pim),
      time_on_ice_seconds: sum_of(rows, :time_on_ice_seconds)
    )
  end

  def sum_of(rows, attribute)
    rows.sum { |row| row.public_send(attribute) }
  end

  # SQL AVG skips NULLs rather than treating them as 0 — filter_map matches that,
  # and nil (not 0) is what "no rows had a value" should mean here too.
  def average_of(rows, attribute)
    values = rows.filter_map { |row| row.public_send(attribute) }
    return nil if values.empty?

    values.sum / values.size
  end
end
