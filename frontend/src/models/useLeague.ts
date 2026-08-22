import { useQuery } from "@tanstack/react-query";
import { fetchLeague } from "@/models/leagues";
import { leagueKey } from "@/models/queryKeys";

export function useLeague(slug: string) {
  return useQuery({
    queryKey: leagueKey(slug),
    queryFn: () => fetchLeague(slug),
    // An empty slug would request the collection endpoint and return an array.
    enabled: slug.length > 0,
  });
}
