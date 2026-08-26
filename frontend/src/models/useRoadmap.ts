import { useQuery } from "@tanstack/react-query";
import { fetchRoadmap } from "@/models/roadmap";
import { ROADMAP_KEY } from "@/models/queryKeys";

export function useRoadmap() {
  return useQuery({ queryKey: ROADMAP_KEY, queryFn: fetchRoadmap });
}
