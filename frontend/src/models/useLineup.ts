import { useQuery } from "@tanstack/react-query";
import { fetchLineup } from "@/models/lineups";
import { teamLineupKey } from "@/models/queryKeys";

export function useLineup(teamId: number, gameId: number | null) {
  return useQuery({
    queryKey: teamLineupKey(teamId, gameId ?? 0),
    queryFn: () => fetchLineup(teamId, gameId as number),
    enabled: gameId !== null,
    retry: false,
  });
}
