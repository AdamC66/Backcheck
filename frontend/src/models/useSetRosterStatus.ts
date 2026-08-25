import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toErrorMessage } from "@/lib/errorMessage";
import { setRosterStatus } from "@/models/rosterStatuses";
import { rosterTransactionsTeamKey, teamRosterKey } from "@/models/queryKeys";
import type { RosterStatusValue } from "@/models/roster";
import { useToast } from "@/toast/useToast";

export function useSetRosterStatus(teamId: number) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

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
    onError: (error) => showToast(toErrorMessage(error), "error"),
  });
}
