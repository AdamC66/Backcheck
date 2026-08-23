import { useQuery } from "@tanstack/react-query";
import { fetchTeam } from "@/models/teams";
import { teamKey } from "@/models/queryKeys";

export function useTeam(teamId: number | null) {
  return useQuery({
    queryKey: teamKey(teamId ?? 0),
    queryFn: () => fetchTeam(teamId as number),
    enabled: teamId !== null,
    retry: false,
  });
}
