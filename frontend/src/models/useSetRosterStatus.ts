import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setRosterStatus } from "@/models/rosterStatuses";
import { rosterTransactionsTeamKey, teamRosterKey } from "@/models/queryKeys";
import type { RosterStatusValue } from "@/models/roster";

export function useSetRosterStatus(teamId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      playerId,
      status,
      effectiveOn,
    }: {
      playerId: number;
      status: RosterStatusValue;
      effectiveOn: string;
    }) => setRosterStatus(teamId, playerId, status, effectiveOn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamRosterKey(teamId) });
      queryClient.invalidateQueries({ queryKey: rosterTransactionsTeamKey(teamId) });
    },
  });
}
