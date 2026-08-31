import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toErrorMessage } from "@/lib/errorMessage";
import { setLineup, type LineupInput } from "@/models/lineups";
import { teamLineupKey } from "@/models/queryKeys";
import { useToast } from "@/toast/useToast";

export function useSetLineup(teamId: number, gameId: number) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (input: LineupInput) => setLineup(teamId, gameId, input),
    onSuccess: (lineup) => {
      queryClient.setQueryData(teamLineupKey(teamId, gameId), lineup);
      showToast("Lineup saved.", "success");
    },
    onError: (error) => showToast(toErrorMessage(error), "error"),
  });
}
