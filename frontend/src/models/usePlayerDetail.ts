import { useQuery } from "@tanstack/react-query";
import { fetchPlayerDetail } from "@/models/playerDetail";
import { playerDetailKey } from "@/models/queryKeys";
import type { GameType } from "@/models/teamStats";

export function usePlayerDetail(playerId: number | null, gameType: GameType = "regular_season") {
  return useQuery({
    queryKey: playerDetailKey(playerId ?? 0, gameType),
    queryFn: () => fetchPlayerDetail(playerId as number, gameType),
    enabled: playerId !== null,
    retry: false,
  });
}
