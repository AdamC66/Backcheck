# The v1 xG feature set for one shot event — the single Ruby definition shared by the
# training-set export (ExportXgTrainingSet) and the serving formula (XgFormula).
# ml/fit.py re-declares the same columns on the Python side; keep the two in sync.
class ShotFeatures
  UNKNOWN = "unknown"

  def initialize(event:, rebound: false)
    @event = event
    @rebound = rebound
    @geometry = ShotGeometry.new(x_coord: event.x_coord, y_coord: event.y_coord,
                                 target_net_x: event.target_net_x)
  end

  # False when the shot has no usable coordinates — distance/angle/danger-zone all
  # depend on them.
  def present?
    @geometry.present?
  end

  def distance = @geometry.distance
  def angle = @geometry.angle
  def rebound? = @rebound

  def shot_type_name
    GameEvent::SHOT_TYPES.key(@event.shot_type)&.to_s || UNKNOWN
  end

  def strength_state_name
    GameEvent::STRENGTH_STATES.key(@event.strength_state)&.to_s || UNKNOWN
  end

  def danger_zone
    DangerZone.classify_geometry(@geometry)
  end
end
