# Weighted sum of a shot's features through a sigmoid — the shape XgModel.coefficients
# stores. Feature keys are flat and match ml/fit.py's output: `distance`, `angle`,
# `rebound`, and one-hot `shot_type_*` / `strength_state_*` / `danger_zone_*` (each
# categorical's reference level is folded into `intercept`, so its key is simply absent
# from the coefficient set). A coefficient the model doesn't carry contributes nothing,
# so a distance/angle-only model (v0-placeholder) runs unchanged through this path.
class XgFormula
  SHOT_TYPE_NAMES = GameEvent::SHOT_TYPES.invert.freeze
  STRENGTH_STATE_NAMES = GameEvent::STRENGTH_STATES.invert.freeze

  def self.calculate(coefficients:, event:, rebound: false)
    features = feature_vector(event, rebound)
    return 0.0 if features.nil?

    coefficients = coefficients.symbolize_keys
    z = coefficients.fetch(:intercept, 0).to_f
    features.each { |key, value| z += coefficients.fetch(key, 0).to_f * value }

    1.0 / (1.0 + Math.exp(-z))
  end

  # nil when the shot has no usable coordinates — distance/angle/danger-zone all fold
  # onto the attacking net via target_net_x, so a physical shot scores identically
  # regardless of which end the team defends that period.
  def self.feature_vector(event, rebound)
    geometry = ShotGeometry.new(x_coord: event.x_coord, y_coord: event.y_coord,
                                target_net_x: event.target_net_x)
    return nil unless geometry.present?

    bucket = DangerZone.classify(x_coord: event.x_coord, y_coord: event.y_coord,
                                 target_net_x: event.target_net_x)

    {
      distance: geometry.distance,
      angle: geometry.angle,
      rebound: rebound ? 1 : 0,
      "shot_type_#{SHOT_TYPE_NAMES.fetch(event.shot_type, :unknown)}": 1,
      "strength_state_#{STRENGTH_STATE_NAMES.fetch(event.strength_state, :unknown)}": 1,
      "danger_zone_#{bucket}": 1
    }
  end
  private_class_method :feature_vector
end
