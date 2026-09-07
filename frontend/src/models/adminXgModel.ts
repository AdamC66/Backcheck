import { request } from "@/lib/apiClient";

export type XgTrainingRunStatus = "exported" | "fitted" | "promoted";

export interface XgModelSummary {
  version: string;
  trained_at: string;
  coefficients: Record<string, number>;
  created_at: string;
}

export interface XgTrainingRunManifest {
  feature_columns?: string[];
  per_season?: Record<string, { shots: number; goals: number }>;
  rebound_window_seconds?: number;
  exported_at?: string;
}

export interface XgTrainingRunMetrics {
  brier?: number;
  log_loss?: number;
  by_season?: Record<string, { brier: number; log_loss: number }>;
  baseline_brier?: number;
}

export interface XgCalibrationBin {
  predicted: number;
  observed: number;
  count: number;
}

export interface XgSampleGame {
  game_id: number;
  matchup?: string;
  team: string;
  xg: number;
  goals: number;
}

export interface XgTrainingRun {
  id: number;
  status: XgTrainingRunStatus;
  label: string | null;
  row_count: number;
  goal_count: number;
  csv_path: string;
  csv_sha256: string;
  manifest: XgTrainingRunManifest;
  feature_set: string[] | null;
  coefficients: Record<string, number> | null;
  metrics: XgTrainingRunMetrics | null;
  calibration: XgCalibrationBin[] | null;
  sample_games: XgSampleGame[] | null;
  notes: string | null;
  source_file: string | null;
  xg_model_id: number | null;
  created_at: string;
}

export interface XgModelDashboard {
  active_model: XgModelSummary | null;
  training_runs: XgTrainingRun[];
}

export const XG_TRAINING_RUN_STATUS_LABELS: Record<XgTrainingRunStatus, string> = {
  exported: "Exported",
  fitted: "Fitted",
  promoted: "Promoted",
};

export function fetchXgModelDashboard(): Promise<XgModelDashboard> {
  return request<XgModelDashboard>("/admin/xg_model");
}
