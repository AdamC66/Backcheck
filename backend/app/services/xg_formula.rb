# A logistic model over distance/angle to the target net. target_net_x is the x
# position of the net a shot is aimed at — resolved by the caller per event from
# home_team_defending_side, since which end a team defends flips by period. Confirmed
# against a live play-by-play response (TASK-74/75) rather than assumed (see
# docs/DECISIONS.md) — this replaced an earlier "coordinates are pre-normalized"
# placeholder from TASK-72.
class XgFormula
  HALF_RINK_X = 89

  def self.calculate(coefficients:, x_coord:, y_coord:, target_net_x:)
    return 0.0 if x_coord.nil? || y_coord.nil? || target_net_x.nil?

    coefficients = coefficients.symbolize_keys
    dx = target_net_x - x_coord
    distance = Math.sqrt((dx**2) + (y_coord**2))
    angle = Math.atan2(y_coord.abs, dx.abs)

    z = coefficients.fetch(:intercept, 0).to_f +
        (coefficients.fetch(:distance, 0).to_f * distance) +
        (coefficients.fetch(:angle, 0).to_f * angle)

    1.0 / (1.0 + Math.exp(-z))
  end
end
