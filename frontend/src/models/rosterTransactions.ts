import { requestWithMeta, type Envelope } from "@/lib/apiClient";
import type { RosterStatusValue } from "@/models/roster";

export interface RosterTransaction {
  player_id: number;
  player_name: string;
  team_id: number;
  team_name: string;
  season: string;
  status: RosterStatusValue;
  started_on: string;
  ended_on: string | null;
}

export interface RosterTransactionsMeta {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export interface FetchRosterTransactionsParams {
  teamId?: number;
  playerId?: number;
  season?: string;
  page?: number;
  perPage?: number;
}

export function fetchRosterTransactions(
  params: FetchRosterTransactionsParams,
): Promise<Envelope<RosterTransaction[], RosterTransactionsMeta>> {
  const query = new URLSearchParams();
  if (params.teamId !== undefined) query.set("team_id", String(params.teamId));
  if (params.playerId !== undefined) query.set("player_id", String(params.playerId));
  if (params.season !== undefined) query.set("season", params.season);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.perPage !== undefined) query.set("per_page", String(params.perPage));

  return requestWithMeta<RosterTransaction[], RosterTransactionsMeta>(
    `/roster_statuses?${query.toString()}`,
  );
}
