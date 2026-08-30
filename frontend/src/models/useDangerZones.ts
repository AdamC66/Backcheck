import { useQuery } from "@tanstack/react-query";
import { fetchDangerZones } from "@/models/dangerZones";
import { DANGER_ZONES_KEY } from "@/models/queryKeys";

export function useDangerZones() {
  return useQuery({ queryKey: DANGER_ZONES_KEY, queryFn: fetchDangerZones, staleTime: Infinity });
}
