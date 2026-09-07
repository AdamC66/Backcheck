import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { XgTrainingRun } from "@/models/adminXgModel";
import { XgTrainingRunCard } from "../XgTrainingRunCard";

const EXPORTED: XgTrainingRun = {
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
};

describe("XgTrainingRunCard", () => {
  it("renders an exported run's counts and per-season breakdown", () => {
    render(<XgTrainingRunCard run={EXPORTED} />);

    expect(screen.getByText("Run #1")).toBeInTheDocument();
    expect(screen.getByText(/373,376 shots · 26,481 goals/)).toBeInTheDocument();
    expect(screen.getByText(/2023-24: 123,055 shots \/ 8,611 goals/)).toBeInTheDocument();
  });

  it("renders validation metrics once a run is fitted", () => {
    render(
      <XgTrainingRunCard
        run={{
          ...EXPORTED,
          status: "fitted",
          label: "v1-full",
          metrics: { brier: 0.0629, log_loss: 0.2337 },
        }}
      />,
    );

    expect(screen.getByText("v1-full")).toBeInTheDocument();
    expect(screen.getByText("Brier 0.0629")).toBeInTheDocument();
  });
});
