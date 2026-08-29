class SkaterGameStatSerializer
  def initialize(stat)
    @stat = stat
  end

  def as_json(*)
    {
      player: PlayerSerializer.new(stat.player).as_json,
      team_id: stat.team_id,
      goals: stat.goals,
      assists: stat.assists,
      points: stat.points,
      plus_minus: stat.plus_minus,
      pim: stat.pim,
      hits: stat.hits,
      power_play_goals: stat.power_play_goals,
      shots_on_goal: stat.shots_on_goal,
      faceoff_winning_pctg: stat.faceoff_winning_pctg&.to_f,
      time_on_ice_seconds: stat.time_on_ice_seconds,
      shifts: stat.shifts,
      blocked_shots: stat.blocked_shots,
      giveaways: stat.giveaways,
      takeaways: stat.takeaways,
      faceoff_wins: stat.faceoff_wins,
      faceoff_losses: stat.faceoff_losses,
      shots_attempted: stat.shots_attempted,
      missed_shots: stat.missed_shots,
      shots_blocked_against: stat.shots_blocked_against
    }
  end

  private

  attr_reader :stat
end
