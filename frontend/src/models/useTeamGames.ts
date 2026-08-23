import { useQuery } from "@tanstack/react-query";
import { fetchTeamGames, type TeamGamesParams } from "@/models/games";
import { teamGamesKey } from "@/models/queryKeys";

export function useTeamGames(teamId: number | null, params: TeamGamesParams = {}) {
  return useQuery({
    queryKey: teamGamesKey(teamId ?? 0, params.season, params.gameType),
    queryFn: () => fetchTeamGames(teamId as number, params),
    enabled: teamId !== null,
    retry: false,
  });
}
