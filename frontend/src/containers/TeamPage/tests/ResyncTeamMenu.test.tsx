import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { fetchCurrentUser } from "@/models/auth";
import { createSyncRun, fetchSyncKinds } from "@/models/adminSync";
import { fetchSeasons } from "@/models/seasons";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { LEAGUES, SUPER_ADMIN, TEAM_USER } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { UserMenu } from "@/containers/UserMenu";
import { ResyncTeamMenu } from "../ResyncTeamMenu";

vi.mock("@/models/auth");
vi.mock("@/models/seasons");
vi.mock("@/models/adminSync", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/models/adminSync")>();
  return { ...actual, fetchSyncKinds: vi.fn(), createSyncRun: vi.fn() };
});

const LEAGUE = LEAGUES[0];

// UserMenu renders nothing until identity resolves, so waiting for it is a
// reliable signal that ResyncTeamMenu's own is_super_admin check has settled too.
async function renderMenu(user = SUPER_ADMIN) {
  localStorage.setItem(TOKEN_KEY, "test-token");
  vi.mocked(fetchCurrentUser).mockResolvedValue(user);

  renderWithProviders(
    <>
      <ResyncTeamMenu teamId={5} league={LEAGUE} />
      <UserMenu />
    </>,
  );

  await screen.findByRole("button", { name: /account menu/i });
}

describe("ResyncTeamMenu", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    vi.mocked(fetchSeasons).mockResolvedValue([]);
  });

  it("is hidden for a non-super-admin", async () => {
    await renderMenu(TEAM_USER);

    expect(screen.queryByRole("button", { name: "Resync" })).not.toBeInTheDocument();
  });

  it("lists only the team-scoped kinds for a super admin", async () => {
    vi.mocked(fetchSyncKinds).mockResolvedValue([
      { kind: "team_roster", scope: ["team"] },
      { kind: "standings", scope: ["league", "date"] },
    ]);
    await renderMenu();

    await userEvent.click(screen.getByRole("button", { name: "Resync" }));

    expect(await screen.findByRole("menuitem", { name: "Team roster" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Standings" })).not.toBeInTheDocument();
  });

  it("posts straight to create, scoped to this team, and navigates to the new run", async () => {
    vi.mocked(fetchSyncKinds).mockResolvedValue([{ kind: "team_roster", scope: ["team"] }]);
    vi.mocked(createSyncRun).mockResolvedValue({
      id: 42,
      status: "queued",
      sync_kinds: ["team_roster"],
      league_id: LEAGUE.id,
      season_id: null,
      team_id: 5,
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
    await renderMenu();

    await userEvent.click(screen.getByRole("button", { name: "Resync" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Team roster" }));

    expect(createSyncRun).toHaveBeenCalledWith({
      sync_kinds: ["team_roster"],
      league_id: LEAGUE.id,
      team_id: 5,
      season_id: undefined,
    });
  });
});
