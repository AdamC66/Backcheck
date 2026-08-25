import { useQuery } from "@tanstack/react-query";
import { fetchTeamStats, type GameType } from "@/models/teamStats";
import { teamStatsKey } from "@/models/queryKeys";

export function useTeamStats(teamId: number | null, gameType: GameType = "regular_season") {
  return useQuery({
    queryKey: teamStatsKey(teamId ?? 0, gameType),
    queryFn: () => fetchTeamStats(teamId as number, gameType),
    enabled: teamId !== null,
    retry: false,
  });
}
