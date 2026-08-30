# target_net_x is resolved by the caller from home_team_defending_side, since which end
# a team defends flips by period — confirmed against live data (docs/DECISIONS.md).
class XgFormula
  def self.calculate(coefficients:, x_coord:, y_coord:, target_net_x:)
    geometry = ShotGeometry.new(x_coord: x_coord, y_coord: y_coord, target_net_x: target_net_x)
    return 0.0 unless geometry.present?

    coefficients = coefficients.symbolize_keys
    z = coefficients.fetch(:intercept, 0).to_f +
        (coefficients.fetch(:distance, 0).to_f * geometry.distance) +
        (coefficients.fetch(:angle, 0).to_f * geometry.angle)

    1.0 / (1.0 + Math.exp(-z))
  end
end
