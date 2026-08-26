# A logistic model over distance/angle to the net. Coordinates are assumed to already
# be relative to the attacking net at (89, 0) — a documented v1 simplification, since
# there's no real ingested play-by-play yet to validate a period/team-aware rink
# normalization against. See docs/DECISIONS.md.
class XgFormula
  NET_X = 89

  def self.calculate(coefficients:, x_coord:, y_coord:)
    return 0.0 if x_coord.nil? || y_coord.nil?

    coefficients = coefficients.symbolize_keys
    distance = Math.sqrt(((NET_X - x_coord)**2) + (y_coord**2))
    angle = Math.atan2(y_coord.abs, NET_X - x_coord)

    z = coefficients.fetch(:intercept, 0).to_f +
        (coefficients.fetch(:distance, 0).to_f * distance) +
        (coefficients.fetch(:angle, 0).to_f * angle)

    1.0 / (1.0 + Math.exp(-z))
  end
end
