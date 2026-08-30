# Shot-danger zone boundaries, adopted from the "home plate" scoring-chance area (Elias /
# War-on-Ice, as used by Natural Stat Trick and MoneyPuck) rather than invented here — per the
# EPIC-18 planning decision. The source defines it verbally as: from the top of the offensive
# faceoff circles, through the faceoff dots, then angled in to the goal posts.
#
# Translated to our coordinate system — feet, attacking net at (XgFormula::HALF_RINK_X, 0), same
# frame XgFormula normalizes shots into. TASK-106 is boundaries only; TASK-107 adds the classifier
# (DangerZone.classify) that consumes them.
class DangerZone
  GOAL_LINE_X = XgFormula::HALF_RINK_X

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
end
