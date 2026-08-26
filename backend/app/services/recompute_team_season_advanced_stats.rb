# Re-sums team_game_advanced_stats from scratch rather than incrementing in place —
# no chain to walk forward here, since a team can't be traded mid-season the way a
# player can. Same discipline as RecomputeSeasonStats.
class RecomputeTeamSeasonAdvancedStats
  def initialize(team:, season:)
    @team = team
    @season = season
  end

  def call
    dimensions.each { |strength_state, score_state| upsert(strength_state, score_state) }
  end

  private

  attr_reader :team, :season

  def base_rows
    TeamGameAdvancedStat.where(team: team).joins(:game).merge(Game.for_season(season))
  end

  # Union with existing rollup rows, not just current game rows — a dimension pair
  # whose last game just got deleted still needs a pass so its stale rollup is cleared.
  def dimensions
    (base_rows.distinct.pluck(:strength_state, :score_state) +
     existing_season_rows.distinct.pluck(:strength_state, :score_state)).uniq
  end

  def existing_season_rows
    TeamSeasonAdvancedStat.where(team: team, season: season)
  end

  def upsert(strength_state, score_state)
    rows = base_rows.where(strength_state: strength_state, score_state: score_state)
    scope = TeamSeasonAdvancedStat.where(team: team, season: season, strength_state: strength_state,
                                        score_state: score_state)
    return scope.destroy_all if rows.none?

    scope.first_or_initialize.update!(
      games_played: rows.count,
      corsi_for: rows.sum(:corsi_for),
      corsi_against: rows.sum(:corsi_against),
      fenwick_for: rows.sum(:fenwick_for),
      fenwick_against: rows.sum(:fenwick_against),
      xg_for: rows.sum(:xg_for),
      xg_against: rows.sum(:xg_against),
      faceoff_wins: rows.sum(:faceoff_wins),
      faceoff_losses: rows.sum(:faceoff_losses),
      pdo: rows.average(:pdo),
      toi_seconds: rows.sum(:toi_seconds)
    )
  end
end
