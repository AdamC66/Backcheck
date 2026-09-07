import { useQuery } from "@tanstack/react-query";
import { fetchGameShots } from "@/models/gameShots";
import { gameShotsKey } from "@/models/queryKeys";

export function useGameShots(gameId: number | null) {
  return useQuery({
    queryKey: gameShotsKey(gameId ?? 0),
    queryFn: () => fetchGameShots(gameId as number),
    enabled: gameId !== null,
    retry: false,
  });
}
