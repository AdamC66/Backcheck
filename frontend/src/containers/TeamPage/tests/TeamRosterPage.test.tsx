import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router";
import { fetchCurrentUser } from "@/models/auth";
import { fetchTeamRoster } from "@/models/roster";
import { fetchTeam } from "@/models/teams";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { SUPER_ADMIN, TEAM_ROSTER, TEAM_WITH_LEAGUE, TEAMS } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { TeamPage } from "../TeamPage";
import { TeamRosterPage } from "../TeamRosterPage";

vi.mock("@/models/auth");
vi.mock("@/models/roster");
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

  it("shows an empty state for a season with no roster on file", async () => {
    vi.mocked(fetchTeamRoster).mockResolvedValue({
      data: [],
      meta: { season: "2025-26", count: 0 },
    });

    renderRoster();

    expect(await screen.findByText("No roster recorded for this season yet.")).toBeInTheDocument();
  });
});
