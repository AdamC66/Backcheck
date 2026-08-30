# Shot-danger zone boundaries, adopted from the "home plate" scoring-chance area (Elias /
# War-on-Ice, as used by Natural Stat Trick and MoneyPuck) rather than invented here — per the
# EPIC-18 planning decision. The source defines it verbally as: from the top of the offensive
# faceoff circles, through the faceoff dots, then angled in to the goal posts.
#
# Constants are expressed in our coordinate system — feet, net at (ShotGeometry::HALF_RINK_X, 0).
class DangerZone
  GOAL_LINE_X = ShotGeometry::HALF_RINK_X

  # Home-plate polygon for the net at +GOAL_LINE_X: top of the faceoff circles (dot x=69 minus
  # the 15ft circle radius), out to the dots at y=±22, angled to the goal posts at y=±3. A shot's
  # x is normalized onto this net before the point-in-polygon test; y-symmetric, so y-sign is moot.
  HIGH_DANGER_POLYGON = [
    [ 54, 22 ], [ 69, 22 ], [ GOAL_LINE_X, 3 ],
    [ GOAL_LINE_X, -3 ], [ 69, -22 ], [ 54, -22 ]
  ].freeze

  # A shot this close is high-danger at any angle — rounds off the polygon's flat goal-line edge
  # so sharp-angle goal-mouth jams still count. ~8ft ≈ the 6ft crease radius plus a stick.
  HIGH_DANGER_CREASE_RADIUS_FT = 8

  # Outside the polygon, this is the mid-range / long-range cutoff. ~60ft sits just inside the
  # offensive blue line (64ft down the middle), so point shots read as long-range.
  MID_RANGE_MAX_DISTANCE_FT = 60

  # :high_danger / :mid_range / :long_range, or nil for a shot with no coordinates.
  def self.classify(x_coord:, y_coord:, target_net_x:)
    geometry = ShotGeometry.new(x_coord: x_coord, y_coord: y_coord, target_net_x: target_net_x)
    return unless geometry.present?

    return :high_danger if geometry.distance <= HIGH_DANGER_CREASE_RADIUS_FT
    return :high_danger if in_polygon?(geometry.offensive_x, geometry.offensive_y)
    return :mid_range if geometry.distance <= MID_RANGE_MAX_DISTANCE_FT

    :long_range
  end

  def self.in_polygon?(x, y)
    poly = HIGH_DANGER_POLYGON
    inside = false
    j = poly.length - 1
    poly.each_index do |i|
      xi, yi = poly[i]
      xj, yj = poly[j]
      inside = !inside if (yi > y) != (yj > y) && x < (((xj - xi) * (y - yi) / (yj - yi).to_f) + xi)
      j = i
    end
    inside
  end
  private_class_method :in_polygon?
end
