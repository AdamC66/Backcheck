import { useQuery } from "@tanstack/react-query";
import { fetchPreviousLineup } from "@/models/lineups";
import { teamPreviousLineupKey } from "@/models/queryKeys";

export function usePreviousLineup(teamId: number, gameId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: teamPreviousLineupKey(teamId, gameId ?? 0),
    queryFn: () => fetchPreviousLineup(teamId, gameId as number),
    enabled: enabled && gameId !== null,
    retry: false,
  });
}
