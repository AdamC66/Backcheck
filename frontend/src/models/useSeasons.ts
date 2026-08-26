import { useQuery } from "@tanstack/react-query";
import { fetchSeasons } from "@/models/seasons";
import { seasonsKey } from "@/models/queryKeys";

export function useSeasons(leagueSlug: string | null) {
  return useQuery({
    queryKey: seasonsKey(leagueSlug ?? ""),
    queryFn: () => fetchSeasons(leagueSlug as string),
    enabled: leagueSlug !== null && leagueSlug.length > 0,
  });
}
