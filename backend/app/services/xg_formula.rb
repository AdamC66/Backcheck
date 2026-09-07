# Weighted sum of a shot's features through a sigmoid — the shape XgModel.coefficients
# stores. Feature keys are flat and match ml/fit.py's output: `distance`, `angle`,
# `rebound`, and one-hot `shot_type_*` / `strength_state_*` / `danger_zone_*` (each
# categorical's reference level is folded into `intercept`, so its key is simply absent
# from the coefficient set). A coefficient the model doesn't carry contributes nothing,
# so a distance/angle-only model (v0-placeholder) runs unchanged through this path.
class XgFormula
  def self.calculate(coefficients:, event:, rebound: false)
    features = ShotFeatures.new(event: event, rebound: rebound)
    return 0.0 unless features.present?

    coefficients = coefficients.symbolize_keys
    z = coefficients.fetch(:intercept, 0).to_f
    feature_vector(features).each { |key, value| z += coefficients.fetch(key, 0).to_f * value }

    1.0 / (1.0 + Math.exp(-z))
  end

  # Every coordinate-derived term folds onto the attacking net inside ShotFeatures, so
  # a physical shot scores identically regardless of which end the team defends.
  def self.feature_vector(features)
    {
      distance: features.distance,
      angle: features.angle,
      rebound: features.rebound? ? 1 : 0,
      "shot_type_#{features.shot_type_name}": 1,
      "strength_state_#{features.strength_state_name}": 1,
      "danger_zone_#{features.danger_zone}": 1
    }
  end
  private_class_method :feature_vector
end
