import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router";
import { fetchCurrentUser } from "@/models/auth";
import { fetchTeam } from "@/models/teams";
import { fetchTeamStats } from "@/models/teamStats";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { SUPER_ADMIN, TEAM_STATS, TEAM_WITH_LEAGUE } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { TeamPage } from "../TeamPage";
import { TeamStatsPage } from "../TeamStatsPage";

vi.mock("@/models/auth");
vi.mock("@/models/teams");
vi.mock("@/models/teamStats");

function renderStats() {
  renderWithProviders(
    <Routes>
      <Route path="/teams/:id" element={<TeamPage />}>
        <Route path="stats" element={<TeamStatsPage />} />
      </Route>
    </Routes>,
    { route: `/teams/${TEAM_WITH_LEAGUE.id}/stats` },
  );
}

describe("TeamStatsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    localStorage.setItem(TOKEN_KEY, "test-token");
    vi.mocked(fetchCurrentUser).mockResolvedValue(SUPER_ADMIN);
    vi.mocked(fetchTeam).mockResolvedValue(TEAM_WITH_LEAGUE);
    vi.mocked(fetchTeamStats).mockResolvedValue(TEAM_STATS);
  });

  it("shows skater and goalie season stats in separate tables", async () => {
    renderStats();

    expect(await screen.findByText("Auston Matthews")).toBeInTheDocument();
    expect(screen.getByText("William Nylander")).toBeInTheDocument();
    expect(screen.getByText("Anthony Stolarz")).toBeInTheDocument();
    expect(screen.getByText("2025-26 · regular season")).toBeInTheDocument();
  });

  it("shows an empty state for a season with no stats on file", async () => {
    vi.mocked(fetchTeamStats).mockResolvedValue({
      data: { skaters: [], goalies: [] },
      meta: { season: "2025-26", game_type: "regular_season", skater_count: 0, goalie_count: 0 },
    });

    renderStats();

    expect(await screen.findByText("No stats recorded for this season yet.")).toBeInTheDocument();
  });
});
