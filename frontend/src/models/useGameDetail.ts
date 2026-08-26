import { useQuery } from "@tanstack/react-query";
import { fetchGameDetail } from "@/models/gameDetail";
import { gameDetailKey } from "@/models/queryKeys";

export function useGameDetail(gameId: number | null) {
  return useQuery({
    queryKey: gameDetailKey(gameId ?? 0),
    queryFn: () => fetchGameDetail(gameId as number),
    enabled: gameId !== null,
    retry: false,
  });
}
