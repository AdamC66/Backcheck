class TeamShotLocationSerializer
  GOAL = :goal

  def initialize(shot)
    @shot = shot
  end

  def as_json(*)
    {
      x: shot.offensive_x,
      y: shot.offensive_y,
      is_goal: shot.event_type == GOAL,
      strength_state: shot.strength_state&.to_s
    }
  end

  private

  attr_reader :shot
end
