import { useQuery } from "@tanstack/react-query";
import { fetchSyncKinds } from "@/models/adminSync";
import { SYNC_KINDS_KEY } from "@/models/queryKeys";

export function useSyncKinds() {
  return useQuery({ queryKey: SYNC_KINDS_KEY, queryFn: fetchSyncKinds });
}
