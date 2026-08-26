import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toErrorMessage } from "@/lib/errorMessage";
import { createSyncRun } from "@/models/adminSync";
import { SYNC_RUNS_KEY } from "@/models/queryKeys";
import { useToast } from "@/toast/useToast";

export function useCreateSyncRun() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: createSyncRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SYNC_RUNS_KEY });
    },
    onError: (error) => showToast(toErrorMessage(error), "error"),
  });
}
