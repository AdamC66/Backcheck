import { useQuery } from "@tanstack/react-query";
import { fetchLeagues } from "@/models/leagues";
import { LEAGUES_KEY } from "@/models/queryKeys";

// Hooks live apart from the request functions they call: a test that mocks the request
// module can't intercept a call made through that module's own internal binding.
export function useLeagues() {
  return useQuery({ queryKey: LEAGUES_KEY, queryFn: fetchLeagues });
}
