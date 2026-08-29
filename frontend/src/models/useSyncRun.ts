import { useQuery } from "@tanstack/react-query";
import { fetchSyncRun } from "@/models/adminSync";
import { syncRunKey } from "@/models/queryKeys";

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled", "completed_with_errors"]);

export function useSyncRun(id: number | null) {
  return useQuery({
    queryKey: syncRunKey(id ?? 0),
    queryFn: () => fetchSyncRun(id as number),
    enabled: id !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status !== undefined && TERMINAL_STATUSES.has(status) ? false : 1500;
    },
  });
}
