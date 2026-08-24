import { useQuery } from "@tanstack/react-query";
import { fetchRosterTransactions } from "@/models/rosterTransactions";
import { rosterTransactionsKey } from "@/models/queryKeys";

export function useRosterTransactions(teamId: number, season: string | undefined, page: number) {
  return useQuery({
    queryKey: rosterTransactionsKey(teamId, season, page),
    queryFn: () => fetchRosterTransactions({ teamId, season, page }),
    enabled: season !== undefined,
  });
}
