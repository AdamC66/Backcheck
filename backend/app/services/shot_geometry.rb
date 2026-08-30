# target_net_x is +/-HALF_RINK_X, resolved by the caller from home_team_defending_side, since
# which end a team attacks flips by period. x_coord/y_coord are nil unless play-by-play was ingested.
class ShotGeometry
  HALF_RINK_X = 89

  def initialize(x_coord:, y_coord:, target_net_x:)
    @x_coord = x_coord
    @y_coord = y_coord
    @target_net_x = target_net_x
  end

  def present?
    !@x_coord.nil? && !@y_coord.nil? && !@target_net_x.nil?
  end

  def distance
    Math.sqrt((dx**2) + (@y_coord**2)) if present?
  end

  def angle
    Math.atan2(@y_coord.abs, dx.abs) if present?
  end

  # Folded onto the net at +HALF_RINK_X, so one frame (and one polygon) serves both ends.
  def offensive_x
    return unless present?

    @target_net_x.negative? ? -@x_coord : @x_coord
  end

  def offensive_y
    return unless present?

    @target_net_x.negative? ? -@y_coord : @y_coord
  end

  private

  def dx
    @target_net_x - @x_coord
  end
end
