import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchXgModelDashboard } from "@/models/adminXgModel";
import { renderWithProviders, screen } from "@/test-utils";
import { XgModelPage } from "../XgModelPage";

vi.mock("@/models/adminXgModel", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/models/adminXgModel")>()),
  fetchXgModelDashboard: vi.fn(),
}));

describe("XgModelPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows the active model and an exported training run", async () => {
    vi.mocked(fetchXgModelDashboard).mockResolvedValue({
      active_model: {
        version: "v0-placeholder",
        trained_at: "2026-08-01T00:00:00Z",
        coefficients: { intercept: 0.2, distance: -0.05 },
        created_at: "2026-08-01T00:00:00Z",
      },
      training_runs: [
        {
          id: 1,
          status: "exported",
          label: null,
          row_count: 373376,
          goal_count: 26481,
          csv_path: "/app/ml/data/training_set.csv",
          csv_sha256: "e06ae868f3be0a71deadbeef",
          manifest: { per_season: { "2023-24": { shots: 123055, goals: 8611 } } },
          feature_set: null,
          coefficients: null,
          metrics: null,
          calibration: null,
          sample_games: null,
          notes: null,
          source_file: null,
          xg_model_id: null,
          created_at: "2026-09-07T12:00:00Z",
        },
      ],
    });

    renderWithProviders(<XgModelPage />);

    expect(await screen.findByText("v0-placeholder")).toBeInTheDocument();
    expect(screen.getByText("Run #1")).toBeInTheDocument();
    expect(screen.getByText(/373,376 shots · 26,481 goals/)).toBeInTheDocument();
    expect(screen.getByText(/2023-24: 123,055 shots \/ 8,611 goals/)).toBeInTheDocument();
  });

  it("shows an empty state with no active model and no runs", async () => {
    vi.mocked(fetchXgModelDashboard).mockResolvedValue({ active_model: null, training_runs: [] });

    renderWithProviders(<XgModelPage />);

    expect(await screen.findByText("No model is active.")).toBeInTheDocument();
    expect(screen.getByText(/No training runs yet/)).toBeInTheDocument();
  });
});
