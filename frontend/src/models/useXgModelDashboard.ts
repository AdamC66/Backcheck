import { useQuery } from "@tanstack/react-query";
import { fetchXgModelDashboard } from "@/models/adminXgModel";
import { XG_MODEL_KEY } from "@/models/queryKeys";

export function useXgModelDashboard() {
  return useQuery({ queryKey: XG_MODEL_KEY, queryFn: fetchXgModelDashboard });
}
