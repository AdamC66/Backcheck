import { requestWithMeta, type Envelope } from "@/lib/apiClient";

export type SyncRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type SyncKind =
  | "team_roster"
  | "affiliate_roster"
  | "team_schedule"
  | "standings"
  | "daily_scores"
  | "game_stats";

export interface SyncRun {
  id: number;
  status: SyncRunStatus;
  sync_kinds: SyncKind[];
  league_id: number | null;
  season_id: number | null;
  team_id: number | null;
  total_steps: number;
  current_step: number;
  current_step_label: string | null;
  percent_complete: number;
  min_interval: number;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  triggered_by_id: number;
}

export type SyncRunCounts = Partial<Record<SyncRunStatus, number>>;

export interface SyncRunsMeta {
  counts: SyncRunCounts;
}

export function fetchSyncRuns(): Promise<Envelope<SyncRun[], SyncRunsMeta>> {
  return requestWithMeta<SyncRun[], SyncRunsMeta>("/admin/sync_runs");
}
