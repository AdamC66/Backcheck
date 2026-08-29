import { useQuery } from "@tanstack/react-query";
import { fetchCoverage } from "@/models/coverage";
import { coverageKey } from "@/models/queryKeys";

export function useCoverage(leagueId: number | null) {
  return useQuery({
    queryKey: coverageKey(leagueId ?? 0),
    queryFn: () => fetchCoverage(leagueId as number),
    enabled: leagueId !== null,
  });
}
