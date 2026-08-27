import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { fetchLeague, fetchLeagues } from "@/models/leagues";
import { createSyncRun, fetchSyncKinds } from "@/models/adminSync";
import { fetchSeasons } from "@/models/seasons";
import { LEAGUE_WITH_TEAMS, LEAGUES } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { NewSyncRunPage } from "../NewSyncRunPage";

vi.mock("@/models/leagues");
vi.mock("@/models/seasons");
vi.mock("@/models/adminSync", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/models/adminSync")>();
  return { ...actual, fetchSyncKinds: vi.fn(), createSyncRun: vi.fn() };
});

describe("NewSyncRunPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fetchLeagues).mockResolvedValue(LEAGUES);
    vi.mocked(fetchLeague).mockResolvedValue(LEAGUE_WITH_TEAMS);
    vi.mocked(fetchSeasons).mockResolvedValue([]);
  });

  it("only shows a team picker for a kind whose scope needs one", async () => {
    vi.mocked(fetchSyncKinds).mockResolvedValue([
      { kind: "team_roster", scope: ["team"] },
      { kind: "standings", scope: ["league", "date"] },
    ]);

    renderWithProviders(<NewSyncRunPage />);

    const kindSelect = await screen.findByLabelText("What to sync");
    // The kinds query resolves after the select itself renders — wait for a real
    // option before selecting it, not just the (initially placeholder-only) select.
    await screen.findByRole("option", { name: "Team roster" });

    await userEvent.selectOptions(kindSelect, "team_roster");
    await userEvent.selectOptions(screen.getByLabelText("League"), LEAGUE_WITH_TEAMS.slug);

    expect(await screen.findByLabelText("Team")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("What to sync"), "standings");

    expect(screen.queryByLabelText("Team")).not.toBeInTheDocument();
  });

  it("submits the chosen scope and rate-limit preset", async () => {
    vi.mocked(fetchSyncKinds).mockResolvedValue([{ kind: "standings", scope: ["league", "date"] }]);
    vi.mocked(createSyncRun).mockResolvedValue({
      id: 1,
      status: "queued",
      sync_kinds: ["standings"],
      league_id: LEAGUE_WITH_TEAMS.id,
      season_id: null,
      team_id: null,
      total_steps: 0,
      current_step: 0,
      current_step_label: null,
      percent_complete: 0,
      min_interval: 1,
      started_at: null,
      finished_at: null,
      error_message: null,
      triggered_by_id: 1,
    });

    renderWithProviders(<NewSyncRunPage />);

    const kindSelect = await screen.findByLabelText("What to sync");
    await screen.findByRole("option", { name: "Standings" });

    await userEvent.selectOptions(kindSelect, "standings");
    await userEvent.selectOptions(screen.getByLabelText("League"), LEAGUE_WITH_TEAMS.slug);
    await userEvent.click(screen.getByRole("button", { name: "Aggressive" }));
    await userEvent.click(screen.getByRole("button", { name: "Start Sync" }));

    // react-query's mutationFn is called with (variables, context) — only the first
    // argument is this mutation's actual payload.
    expect(vi.mocked(createSyncRun).mock.calls[0]?.[0]).toEqual({
      sync_kinds: ["standings"],
      league_id: LEAGUE_WITH_TEAMS.id,
      team_id: undefined,
      season_id: undefined,
      min_interval_preset: "aggressive",
    });
  });
});
