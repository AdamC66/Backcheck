import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router";
import { fetchCurrentUser } from "@/models/auth";
import { fetchTeamGames } from "@/models/games";
import { fetchTeam } from "@/models/teams";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { SUPER_ADMIN, TEAM_GAMES, TEAM_WITH_LEAGUE, TEAMS } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { TeamPage } from "../TeamPage";
import { TeamOverviewPage } from "../TeamOverviewPage";
import { TeamSchedulePage } from "../TeamSchedulePage";
import { TeamRosterPage } from "../TeamRosterPage";

vi.mock("@/models/auth");
vi.mock("@/models/games");
vi.mock("@/models/teams");

function renderTeam(route = `/teams/${TEAMS[0].id}`) {
  renderWithProviders(
    <Routes>
      <Route path="/teams/:id" element={<TeamPage />}>
        <Route index element={<TeamOverviewPage />} />
        <Route path="schedule" element={<TeamSchedulePage />} />
        <Route path="roster" element={<TeamRosterPage />} />
      </Route>
    </Routes>,
    { route },
  );
}

describe("TeamPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    localStorage.setItem(TOKEN_KEY, "test-token");
    vi.mocked(fetchCurrentUser).mockResolvedValue(SUPER_ADMIN);
    vi.mocked(fetchTeam).mockResolvedValue(TEAM_WITH_LEAGUE);
    vi.mocked(fetchTeamGames).mockResolvedValue(TEAM_GAMES);
  });

  it("shows the team's header and links to its section", async () => {
    renderTeam(`/teams/${TEAMS[0].id}/schedule`);

    expect(await screen.findByRole("heading", { name: "Anaheim Ducks" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Schedule" })).toHaveAttribute("aria-current", "page");
  });

  it("goes back to the team's league, not the league list", async () => {
    renderTeam();

    const back = await screen.findByRole("link", { name: /National Hockey League/ });

    expect(back).toHaveAttribute("href", "/leagues/nhl");
  });
});
