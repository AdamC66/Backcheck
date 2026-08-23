import { useQuery } from "@tanstack/react-query";
import { fetchTeamRoster } from "@/models/roster";
import { teamRosterKey } from "@/models/queryKeys";

export function useTeamRoster(teamId: number | null) {
  return useQuery({
    queryKey: teamRosterKey(teamId ?? 0),
    queryFn: () => fetchTeamRoster(teamId as number),
    enabled: teamId !== null,
    retry: false,
  });
}
