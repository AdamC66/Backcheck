import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router";
import { fetchCurrentUser } from "@/models/auth";
import { fetchTeamGames } from "@/models/games";
import { fetchStandings } from "@/models/standings";
import { fetchTeam } from "@/models/teams";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { SUPER_ADMIN, STANDINGS, TEAM_WITH_LEAGUE, TEAMS, gameFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { TeamPage } from "../TeamPage";
import { TeamOverviewPage } from "../TeamOverviewPage";

vi.mock("@/models/auth");
vi.mock("@/models/games");
vi.mock("@/models/standings");
vi.mock("@/models/teams");

function renderOverview() {
  renderWithProviders(
    <Routes>
      <Route path="/teams/:id" element={<TeamPage />}>
        <Route index element={<TeamOverviewPage />} />
      </Route>
    </Routes>,
    { route: `/teams/${TEAMS[0].id}` },
  );
}

// The container relies on the real clock (no injectable "today"), so fixtures are
// built relative to it rather than hardcoded — a hardcoded future date eventually
// becomes the past out from under the test.
function daysFromNow(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);

  return date.toISOString().slice(0, 10);
}

describe("TeamOverviewPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    localStorage.setItem(TOKEN_KEY, "test-token");
    vi.mocked(fetchCurrentUser).mockResolvedValue(SUPER_ADMIN);
    vi.mocked(fetchTeam).mockResolvedValue(TEAM_WITH_LEAGUE);
    vi.mocked(fetchStandings).mockResolvedValue(STANDINGS);
  });

  it("shows KPI tiles built from the team's real standings row", async () => {
    vi.mocked(fetchTeamGames).mockResolvedValue({
      data: [],
      meta: { season: "2025-26", count: 0 },
    });

    renderOverview();

    expect(await screen.findByText("50-25-7")).toBeInTheDocument();
    expect(screen.getByText("1st · Central Division")).toBeInTheDocument();
    expect(screen.getByText("121")).toBeInTheDocument();
    expect(screen.getByText("W3")).toBeInTheDocument();
  });

  it("splits games into the last 3 played and the next 3 scheduled", async () => {
    vi.mocked(fetchTeamGames).mockResolvedValue({
      data: [
        gameFor({ id: 1, game_date: daysFromNow(-3), state: "OFF" }),
        gameFor({ id: 2, game_date: daysFromNow(3), state: "FUT", last_period_type: null }),
      ],
      meta: { season: "2025-26", count: 2 },
    });

    renderOverview();

    expect(await screen.findByText("Last 3 games")).toBeInTheDocument();
    expect(screen.getByText("Next 3 games")).toBeInTheDocument();
    // Both fixtures have Anaheim (the requested team) at home, so Boston is the
    // opponent shown in both the recent and the upcoming card.
    expect(screen.getAllByText("Boston Bruins")).toHaveLength(2);
  });

  it("shows an empty state when nothing is scheduled ahead", async () => {
    vi.mocked(fetchTeamGames).mockResolvedValue({
      data: [gameFor({ id: 1, game_date: daysFromNow(-3), state: "OFF" })],
      meta: { season: "2025-26", count: 1 },
    });

    renderOverview();

    expect(await screen.findByText("No games scheduled.")).toBeInTheDocument();
  });
});
