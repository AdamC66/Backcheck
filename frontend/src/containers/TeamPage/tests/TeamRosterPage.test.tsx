import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router";
import userEvent from "@testing-library/user-event";
import { fetchCurrentUser } from "@/models/auth";
import { fetchTeamRoster } from "@/models/roster";
import { fetchRosterTransactions } from "@/models/rosterTransactions";
import { fetchTeam } from "@/models/teams";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import {
  ROSTER_TRANSACTIONS,
  SUPER_ADMIN,
  TEAM_ROSTER,
  TEAM_WITH_LEAGUE,
  TEAMS,
  playerFor,
  rosterEntryFor,
} from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { TeamPage } from "../TeamPage";
import { TeamRosterPage } from "../TeamRosterPage";

vi.mock("@/models/auth");
vi.mock("@/models/roster");
vi.mock("@/models/rosterTransactions");
vi.mock("@/models/teams");

function renderRoster() {
  renderWithProviders(
    <Routes>
      <Route path="/teams/:id" element={<TeamPage />}>
        <Route path="roster" element={<TeamRosterPage />} />
      </Route>
    </Routes>,
    { route: `/teams/${TEAMS[0].id}/roster` },
  );
}

describe("TeamRosterPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    localStorage.setItem(TOKEN_KEY, "test-token");
    vi.mocked(fetchCurrentUser).mockResolvedValue(SUPER_ADMIN);
    vi.mocked(fetchTeam).mockResolvedValue(TEAM_WITH_LEAGUE);
    vi.mocked(fetchTeamRoster).mockResolvedValue(TEAM_ROSTER);
    vi.mocked(fetchRosterTransactions).mockResolvedValue(ROSTER_TRANSACTIONS);
  });

  it("groups the roster by position", async () => {
    renderRoster();

    expect(await screen.findByText("Forwards")).toBeInTheDocument();
    expect(screen.getByText("Defensemen")).toBeInTheDocument();
    expect(screen.getByText("Auston Matthews")).toBeInTheDocument();
    expect(screen.getByText("Morgan Rielly")).toBeInTheDocument();
  });

  it("shows which affiliate a player is currently assigned to", async () => {
    renderRoster();

    await screen.findByText("Easton Cowan");

    expect(screen.getByTitle("Assigned to MRL Club")).toHaveTextContent("MRL");
  });

  it("keeps an injured player inline but moves a non-roster player to its own tab", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchTeamRoster).mockResolvedValue({
      data: [
        ...TEAM_ROSTER.data,
        rosterEntryFor({
          player: playerFor(99, { first_name: "Off", last_name: "Roster" }),
          roster_status: { status: "non_roster", started_on: "2026-08-01" },
        }),
      ],
      meta: TEAM_ROSTER.meta,
    });

    renderRoster();

    await screen.findByText("Auston Matthews");
    expect(screen.queryByText("Off Roster")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Non-Roster" }));

    expect(await screen.findByText("Off Roster")).toBeInTheDocument();
    expect(screen.queryByText("Auston Matthews")).not.toBeInTheDocument();
  });

  it("shows an empty state for a season with no roster on file", async () => {
    vi.mocked(fetchTeamRoster).mockResolvedValue({
      data: [],
      meta: { season: "2025-26", count: 0 },
    });

    renderRoster();

    expect(await screen.findByText("No roster recorded for this season yet.")).toBeInTheDocument();
  });
});
