import { request, requestWithMeta, type Envelope } from "@/lib/apiClient";
import type { SyncKind } from "@/models/adminSync";

export type CoverageKind = "games" | "roster" | "stats" | "advanced";

// The sync kind a cell's "Sync" action fires to fill that coverage kind.
export const COVERAGE_SYNC_KIND: Record<CoverageKind, SyncKind> = {
  games: "team_schedule",
  roster: "team_roster",
  stats: "game_stats",
  advanced: "advanced_stats",
};

export const COVERAGE_KIND_LABELS: Record<CoverageKind, string> = {
  games: "Games",
  roster: "Roster",
  stats: "Stats",
  advanced: "Advanced stats",
};

// synced/total are null for a kind the league has no pipeline for.
export interface CoverageCell {
  synced: number | null;
  total: number | null;
  stale: number;
  syncing: number;
}

export interface CoverageRow {
  season_id: number;
  season_label: string;
  games: CoverageCell;
  roster: CoverageCell;
  stats: CoverageCell;
  advanced: CoverageCell;
}

export function fetchCoverage(leagueId: number): Promise<CoverageRow[]> {
  return request<CoverageRow[]>(`/admin/coverage?league_id=${leagueId}`);
}

export interface CoverageGameGap {
  game_id: number;
  game_date: string;
  matchup: string;
  state: string;
  present: boolean;
  flagged: boolean;
  flag: "syncing" | "stale";
}

export interface CoverageTeamGap {
  team_id: number;
  team_name: string;
  synced?: number;
  expected?: number | null;
  missing?: number | null;
  roster_spots?: number;
  present?: boolean;
}

export type CoverageGapRow = CoverageGameGap | CoverageTeamGap;

export interface CoverageGapMeta {
  kind: CoverageKind;
}

export function fetchCoverageGaps(
  seasonId: number,
  kind: string,
): Promise<Envelope<CoverageGapRow[], CoverageGapMeta>> {
  return requestWithMeta<CoverageGapRow[], CoverageGapMeta>(`/admin/coverage/${seasonId}/${kind}`);
}
