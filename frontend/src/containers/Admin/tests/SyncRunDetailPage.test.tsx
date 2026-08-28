import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router";
import userEvent from "@testing-library/user-event";
import { cancelSyncRun, fetchSyncRun, type SyncRunDetail } from "@/models/adminSync";
import { renderWithProviders, screen } from "@/test-utils";
import { SyncRunDetailPage } from "../SyncRunDetailPage";

vi.mock("@/models/adminSync", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/models/adminSync")>();
  return { ...actual, fetchSyncRun: vi.fn(), cancelSyncRun: vi.fn() };
});

function runDetailFor(overrides: Partial<SyncRunDetail> = {}): SyncRunDetail {
  return {
    id: 1,
    status: "running",
    sync_kinds: ["team_roster"],
    league_id: 1,
    season_id: null,
    team_id: null,
    total_steps: 2,
    current_step: 1,
    current_step_label: "team roster — San Jose Sharks",
    percent_complete: 50,
    min_interval: 1.0,
    started_at: "2026-08-25T12:00:00Z",
    finished_at: null,
    error_message: null,
    triggered_by_id: 1,
    items: [
      {
        id: 10,
        kind: "team_roster",
        team_id: 5,
        team_name: "San Jose Sharks",
        status: "completed",
        started_at: "2026-08-25T12:00:00Z",
        finished_at: "2026-08-25T12:00:05Z",
        error_message: null,
        failed_games: [],
      },
    ],
    activity_log: [{ at: "2026-08-25T12:00:00Z", message: "Run started (2 step(s))" }],
    ...overrides,
  };
}

function renderDetail(id = 1) {
  renderWithProviders(
    <Routes>
      <Route path="/admin/sync/:id" element={<SyncRunDetailPage />} />
    </Routes>,
    { route: `/admin/sync/${id}` },
  );
}

describe("SyncRunDetailPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders progress, items, and the activity log", async () => {
    vi.mocked(fetchSyncRun).mockResolvedValue(runDetailFor());

    renderDetail();

    expect(await screen.findByText("San Jose Sharks")).toBeInTheDocument();
    expect(screen.getByText("1/2 (50%) — running")).toBeInTheDocument();
    expect(screen.getByText("Run started (2 step(s))")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("cancels a running sync", async () => {
    vi.mocked(fetchSyncRun).mockResolvedValue(runDetailFor());
    vi.mocked(cancelSyncRun).mockResolvedValue(runDetailFor({ status: "cancelled" }));

    renderDetail();

    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(cancelSyncRun).toHaveBeenCalledWith(1);
  });

  it("hides the cancel button once a run has finished", async () => {
    vi.mocked(fetchSyncRun).mockResolvedValue(runDetailFor({ status: "completed" }));

    renderDetail();

    await screen.findByText("San Jose Sharks");

    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("lists every failed game on an item, not just a generic failed status", async () => {
    vi.mocked(fetchSyncRun).mockResolvedValue(
      runDetailFor({
        status: "failed",
        items: [
          {
            id: 10,
            kind: "game_stats",
            team_id: null,
            team_name: null,
            status: "failed",
            started_at: "2026-08-25T12:00:00Z",
            finished_at: "2026-08-25T12:00:05Z",
            error_message: null,
            failed_games: [
              { nhl_game_id: 1, label: "ANA @ SJS", error: "Socket::ResolutionError" },
              { nhl_game_id: 2, label: "SJS @ LAK", error: "boom" },
            ],
          },
        ],
      }),
    );

    renderDetail();

    expect(await screen.findByText("2 games failed:")).toBeInTheDocument();
    expect(screen.getByText("ANA @ SJS: Socket::ResolutionError")).toBeInTheDocument();
    expect(screen.getByText("SJS @ LAK: boom")).toBeInTheDocument();
  });
});
