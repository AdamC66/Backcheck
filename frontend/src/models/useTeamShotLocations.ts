import { useQuery } from "@tanstack/react-query";
import type { GameType } from "@/models/games";
import { fetchTeamShotLocations } from "@/models/teamShotLocations";
import { teamShotLocationsKey } from "@/models/queryKeys";

export function useTeamShotLocations(
  teamId: number,
  params: { season?: string; gameType?: GameType },
) {
  return useQuery({
    queryKey: teamShotLocationsKey(teamId, params.season, params.gameType),
    queryFn: () => fetchTeamShotLocations(teamId, params),
  });
}
