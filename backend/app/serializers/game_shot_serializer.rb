class GameShotSerializer
  def initialize(shot)
    @shot = shot
  end

  def as_json(*)
    {
      x: shot.x,
      y: shot.y,
      team_side: shot.team_side.to_s,
      is_goal: shot.is_goal,
      shot_type: shot.shot_type,
      distance: shot.distance,
      xg: shot.xg,
      shooter_id: shot.shooter_id,
      shooter_name: shot.shooter_name,
      period: shot.period,
      period_time_seconds: shot.period_time_seconds
    }
  end

  private

  attr_reader :shot
end
