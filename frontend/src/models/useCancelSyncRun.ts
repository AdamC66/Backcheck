import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toErrorMessage } from "@/lib/errorMessage";
import { cancelSyncRun } from "@/models/adminSync";
import { SYNC_RUNS_KEY, syncRunKey } from "@/models/queryKeys";
import { useToast } from "@/toast/useToast";

export function useCancelSyncRun(id: number) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: () => cancelSyncRun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: syncRunKey(id) });
      queryClient.invalidateQueries({ queryKey: SYNC_RUNS_KEY });
    },
    onError: (error) => showToast(toErrorMessage(error), "error"),
  });
}
