import { useQuery } from "@tanstack/react-query";
import { fetchTeamAffiliations } from "@/models/teamAffiliations";
import { teamAffiliationsKey } from "@/models/queryKeys";

export function useTeamAffiliations(teamId: number) {
  return useQuery({
    queryKey: teamAffiliationsKey(teamId),
    queryFn: () => fetchTeamAffiliations(teamId),
  });
}
