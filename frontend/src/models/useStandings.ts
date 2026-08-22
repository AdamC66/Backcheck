import { useQuery } from "@tanstack/react-query";
import { fetchStandings } from "@/models/standings";
import { standingsKey } from "@/models/queryKeys";

export function useStandings(slug: string) {
  return useQuery({
    queryKey: standingsKey(slug),
    queryFn: () => fetchStandings(slug),
    enabled: slug.length > 0,
    // Leagues without an ingested season answer 404, and that won't change on a retry.
    retry: false,
  });
}
