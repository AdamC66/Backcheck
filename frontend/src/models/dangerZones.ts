import { request } from "@/lib/apiClient";

export type RinkPoint = [number, number];

export interface DangerZoneGeometry {
  goal_line_x: number;
  high_danger_polygon: RinkPoint[];
  high_danger_crease_radius_ft: number;
  mid_range_max_distance_ft: number;
}

export function fetchDangerZones(): Promise<DangerZoneGeometry> {
  return request<DangerZoneGeometry>("/danger_zones");
}
