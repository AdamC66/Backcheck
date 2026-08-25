import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toErrorMessage } from "@/lib/errorMessage";
import { callPlayerUp } from "@/models/reassignments";
import { teamRosterKey } from "@/models/queryKeys";
import { useToast } from "@/toast/useToast";

export function useCallPlayerUp(teamId: number) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ playerId }: { playerId: number }) => callPlayerUp(teamId, playerId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: teamRosterKey(teamId) });
      queryClient.invalidateQueries({ queryKey: teamRosterKey(result.team.id) });
    },
    onError: (error) => showToast(toErrorMessage(error), "error"),
  });
}
