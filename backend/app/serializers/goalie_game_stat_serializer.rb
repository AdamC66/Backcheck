class GoalieGameStatSerializer
  def initialize(stat)
    @stat = stat
  end

  def as_json(*)
    {
      player: PlayerSerializer.new(stat.player).as_json,
      team_id: stat.team_id,
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
      pim: stat.pim,
      time_on_ice_seconds: stat.time_on_ice_seconds,
      starter: stat.starter,
      decision: stat.decision
    }
  end

  private

  attr_reader :stat

  # Safe to derive here, unlike a season rollup: a real single-game attempt count, not
  # an average of per-game ratios with no attempts to weight by.
  def save_pctg
    return nil if stat.shots_against.zero?

    (stat.saves.to_f / stat.shots_against).round(4)
  end
end
