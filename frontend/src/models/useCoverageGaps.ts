import { useQuery } from "@tanstack/react-query";
import { fetchCoverageGaps } from "@/models/coverage";
import { coverageGapsKey } from "@/models/queryKeys";

export function useCoverageGaps(seasonId: number | null, kind: string) {
  return useQuery({
    queryKey: coverageGapsKey(seasonId ?? 0, kind),
    queryFn: () => fetchCoverageGaps(seasonId as number, kind),
    enabled: seasonId !== null,
  });
}
