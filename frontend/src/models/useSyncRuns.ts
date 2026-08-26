import { useQuery } from "@tanstack/react-query";
import { fetchSyncRuns } from "@/models/adminSync";
import { SYNC_RUNS_KEY } from "@/models/queryKeys";

export function useSyncRuns() {
  return useQuery({ queryKey: SYNC_RUNS_KEY, queryFn: fetchSyncRuns });
}
