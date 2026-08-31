import { useQuery } from "@tanstack/react-query";
import { fetchTeamRoster } from "@/models/roster";
import { teamRosterKey } from "@/models/queryKeys";

export function useTeamRoster(teamId: number | null, season?: string) {
  return useQuery({
    queryKey: teamRosterKey(teamId ?? 0, season),
    queryFn: () => fetchTeamRoster(teamId as number, season),
    enabled: teamId !== null,
    retry: false,
  });
}
