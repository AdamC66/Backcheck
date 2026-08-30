class DangerZoneSerializer
  def as_json(*)
    {
      goal_line_x: DangerZone::GOAL_LINE_X,
      high_danger_polygon: DangerZone::HIGH_DANGER_POLYGON,
      high_danger_crease_radius_ft: DangerZone::HIGH_DANGER_CREASE_RADIUS_FT,
      mid_range_max_distance_ft: DangerZone::MID_RANGE_MAX_DISTANCE_FT
    }
  end
end
