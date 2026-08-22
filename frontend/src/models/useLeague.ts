import { useQuery } from "@tanstack/react-query";
import { fetchLeague } from "@/models/leagues";
import { leagueKey } from "@/models/queryKeys";

export function useLeague(slug: string) {
  return useQuery({
    queryKey: leagueKey(slug),
    queryFn: () => fetchLeague(slug),
    // A missing route param would otherwise request the collection endpoint and get
    // back an array where the caller's types promise a league.
    enabled: slug.length > 0,
  });
}
