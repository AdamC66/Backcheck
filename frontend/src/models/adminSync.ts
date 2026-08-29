import { request, requestWithMeta, type Envelope } from "@/lib/apiClient";

export type SyncRunStatus =
  "queued" | "running" | "completed" | "failed" | "cancelled" | "completed_with_errors";

export type SyncKind =
  | "team_roster"
  | "affiliate_roster"
  | "team_schedule"
  | "standings"
  | "daily_scores"
  | "game_stats"
  | "advanced_stats"
  | "rebuild_season_stats";

export const SYNC_RUN_STATUS_LABELS: Record<SyncRunStatus, string> = {
  queued: "queued",
  running: "running",
  completed: "completed",
  failed: "failed",
  cancelled: "cancelled",
  completed_with_errors: "completed with errors",
};

export const SYNC_KIND_LABELS: Record<SyncKind, string> = {
  team_roster: "Team roster",
  affiliate_roster: "Affiliate roster",
  team_schedule: "Team schedule",
  standings: "Standings",
  daily_scores: "Daily scores",
  game_stats: "Game stats",
  advanced_stats: "Advanced stats",
  rebuild_season_stats: "Rebuild season stats",
};

export interface SyncRun {
  id: number;
  status: SyncRunStatus;
  sync_kinds: SyncKind[];
  league_id: number | null;
  league_name: string | null;
  season_id: number | null;
  season_label: string | null;
  team_id: number | null;
  team_name: string | null;
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

export type ScopeAxis = "team" | "season" | "league" | "date";

export interface SyncKindInfo {
  kind: SyncKind;
  scope: ScopeAxis[];
}

export function fetchSyncKinds(): Promise<SyncKindInfo[]> {
  return request<SyncKindInfo[]>("/admin/sync_kinds");
}

export type MinIntervalPreset = "conservative" | "normal" | "aggressive";

export const MIN_INTERVAL_PRESET_OPTIONS: { value: MinIntervalPreset; label: string }[] = [
  { value: "conservative", label: "Conservative" },
  { value: "normal", label: "Normal" },
  { value: "aggressive", label: "Aggressive" },
];

export interface CreateSyncRunPayload {
  sync_kinds: SyncKind[];
  league_id?: number;
  season_id?: number;
  team_id?: number;
  min_interval_preset?: MinIntervalPreset;
}

export function createSyncRun(payload: CreateSyncRunPayload): Promise<SyncRun> {
  return request<SyncRun>("/admin/sync_runs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface FailedGame {
  nhl_game_id: number;
  label: string;
  error: string;
}

export interface SyncRunItemPayload {
  id: number;
  kind: SyncKind;
  team_id: number | null;
  team_name: string | null;
  status: SyncRunStatus;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  failed_games: FailedGame[];
}

export interface SyncRunActivityLogEntry {
  at: string;
  message: string;
}

export interface SyncRunDetail extends SyncRun {
  items: SyncRunItemPayload[];
  activity_log: SyncRunActivityLogEntry[];
}

export function fetchSyncRun(id: number): Promise<SyncRunDetail> {
  return request<SyncRunDetail>(`/admin/sync_runs/${id}`);
}

export function cancelSyncRun(id: number): Promise<SyncRun> {
  return request<SyncRun>(`/admin/sync_runs/${id}/cancel`, { method: "POST" });
}
