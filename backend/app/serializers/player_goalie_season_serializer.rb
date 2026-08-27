class PlayerGoalieSeasonSerializer
  def initialize(stat)
    @stat = stat
  end

  def as_json(*)
    {
      season: SeasonSerializer.new(stat.season).as_json,
      team: TeamSerializer.new(stat.team).as_json,
      games_played: stat.games_played,
      games_started: stat.games_started,
      wins: stat.wins,
      losses: stat.losses,
      ot_losses: stat.ot_losses,
      shutouts: stat.shutouts,
      even_strength_shots_against: stat.even_strength_shots_against,
      even_strength_goals_against: stat.even_strength_goals_against,
      power_play_shots_against: stat.power_play_shots_against,
      power_play_goals_against: stat.power_play_goals_against,
      shorthanded_shots_against: stat.shorthanded_shots_against,
      shorthanded_goals_against: stat.shorthanded_goals_against,
      shots_against: stat.shots_against,
      saves: stat.saves,
      goals_against: stat.goals_against,
      save_pctg: save_pctg,
      goals_against_average: goals_against_average,
      pim: stat.pim,
      time_on_ice_seconds: stat.time_on_ice_seconds
    }
  end

  private

  attr_reader :stat

  # Safe to derive, unlike faceoff_winning_pctg: a real sum of attempts, not a per-game
  # ratio with no attempts count to weight by. See docs/DECISIONS.md.
  def save_pctg
    return nil if stat.shots_against.zero?

    (stat.saves.to_f / stat.shots_against).round(4)
  end

  def goals_against_average
    return nil if stat.time_on_ice_seconds.zero?

    (stat.goals_against.to_f * 3600 / stat.time_on_ice_seconds).round(2)
  end
end
