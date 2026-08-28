# Re-sums team_game_advanced_stats from scratch rather than incrementing in place —
# no chain to walk forward here, since a team can't be traded mid-season the way a
# player can. Same discipline as RecomputeSeasonStats.
class RecomputeTeamSeasonAdvancedStats
  def initialize(team:, season:)
    @team = team
    @season = season
  end

  def call
    dimensions.each { |strength_state, score_state, game_type| upsert(strength_state, score_state, game_type) }
  end

  private

  attr_reader :team, :season

  # Loaded once and grouped in Ruby — each dimension used to issue its own 11
  # aggregate queries (one count, ten sum/average) off this same relation (TASK-95).
  def base_rows
    @base_rows ||= TeamGameAdvancedStat.where(team: team).joins(:game).merge(Game.for_season(season))
                                        .includes(:game).to_a
  end

  # Union with existing rollup rows, not just current game rows — a dimension triple
  # whose last game just got deleted still needs a pass so its stale rollup is cleared.
  def dimensions
    (base_rows.map { |row| [ row.strength_state, row.score_state, row.game.game_type ] } +
     existing_season_rows.distinct.pluck(:strength_state, :score_state, :game_type)).uniq
  end

  def existing_season_rows
    TeamSeasonAdvancedStat.where(team: team, season: season)
  end

  def upsert(strength_state, score_state, game_type)
    rows = base_rows.select do |row|
      row.strength_state == strength_state && row.score_state == score_state && row.game.game_type == game_type
    end
    scope = TeamSeasonAdvancedStat.where(team: team, season: season, strength_state: strength_state,
                                        score_state: score_state, game_type: game_type)
    return scope.destroy_all if rows.none?

    scope.first_or_initialize.update!(
      games_played: rows.size,
      corsi_for: sum_of(rows, :corsi_for),
      corsi_against: sum_of(rows, :corsi_against),
      fenwick_for: sum_of(rows, :fenwick_for),
      fenwick_against: sum_of(rows, :fenwick_against),
      xg_for: sum_of(rows, :xg_for),
      xg_against: sum_of(rows, :xg_against),
      faceoff_wins: sum_of(rows, :faceoff_wins),
      faceoff_losses: sum_of(rows, :faceoff_losses),
      pdo: average_of(rows, :pdo),
      toi_seconds: sum_of(rows, :toi_seconds)
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
