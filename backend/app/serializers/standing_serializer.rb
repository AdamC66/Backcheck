class StandingSerializer
  def initialize(standing)
    @standing = standing
  end

  def as_json(*)
    {
      team: TeamSerializer.new(standing.team).as_json,
      as_of_date: standing.as_of_date,
      games_played: standing.games_played,
      wins: standing.wins,
      losses: standing.losses,
      ot_losses: standing.ot_losses,
      points: standing.points,
      point_pctg: standing.point_pctg&.to_f,
      goals_for: standing.goals_for,
      goals_against: standing.goals_against,
      goal_differential: standing.goal_differential,
      regulation_wins: standing.regulation_wins,
      regulation_plus_ot_wins: standing.regulation_plus_ot_wins,
      streak_code: standing.streak_code,
      streak_count: standing.streak_count,
      conference_name: standing.conference_name,
      conference_sequence: standing.conference_sequence,
      division_name: standing.division_name,
      division_sequence: standing.division_sequence,
      league_sequence: standing.league_sequence,
      wildcard_sequence: standing.wildcard_sequence,
      home_record: record(standing.home_wins, standing.home_losses, standing.home_ot_losses),
      road_record: record(standing.road_wins, standing.road_losses, standing.road_ot_losses),
      l10_record: record(standing.l10_wins, standing.l10_losses, standing.l10_ot_losses)
    }
  end

  private

  attr_reader :standing

  # Splits ship as one object rather than nine sibling keys — they're only ever read
  # together, and it keeps the payload legible.
  def record(wins, losses, ot_losses)
    { wins: wins, losses: losses, ot_losses: ot_losses }
  end
end
