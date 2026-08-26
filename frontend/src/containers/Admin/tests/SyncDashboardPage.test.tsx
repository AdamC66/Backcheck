import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchSyncRuns } from "@/models/adminSync";
import { renderWithProviders, screen } from "@/test-utils";
import { SyncDashboardPage } from "../SyncDashboardPage";

vi.mock("@/models/adminSync");

describe("SyncDashboardPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists a recent run with its progress", async () => {
    vi.mocked(fetchSyncRuns).mockResolvedValue({
      data: [
        {
          id: 1,
          status: "running",
          sync_kinds: ["team_roster"],
          league_id: 1,
          season_id: null,
          team_id: 5,
          total_steps: 4,
          current_step: 2,
          current_step_label: "team roster — San Jose Sharks",
          percent_complete: 50,
          min_interval: 1.0,
          started_at: "2026-08-25T12:00:00Z",
          finished_at: null,
          error_message: null,
          triggered_by_id: 1,
        },
      ],
      meta: { counts: { running: 1 } },
    });

    renderWithProviders(<SyncDashboardPage />);

    expect(await screen.findByText("Team roster")).toBeInTheDocument();
    expect(screen.getByText("team roster — San Jose Sharks")).toBeInTheDocument();
    expect(screen.getByText("2/4 (50%)")).toBeInTheDocument();
  });

  it("shows an empty state with no runs yet", async () => {
    vi.mocked(fetchSyncRuns).mockResolvedValue({ data: [], meta: { counts: {} } });

    renderWithProviders(<SyncDashboardPage />);

    expect(await screen.findByText("No sync runs yet.")).toBeInTheDocument();
  });
});
