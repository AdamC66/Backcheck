import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router";
import userEvent from "@testing-library/user-event";
import { fetchCurrentUser } from "@/models/auth";
import { fetchTeam } from "@/models/teams";
import { fetchTeamStats } from "@/models/teamStats";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import {
  SUPER_ADMIN,
  TEAM_STATS,
  TEAM_WITH_LEAGUE,
  playerSeasonAdvancedStatFor,
  teamSeasonAdvancedStatFor,
} from "@/test-mocks";
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

    // Appears in both the skater table and the per-player advanced table.
    expect((await screen.findAllByText("Auston Matthews")).length).toBe(2);
    expect(screen.getByText("William Nylander")).toBeInTheDocument();
    expect(screen.getByText("Anthony Stolarz")).toBeInTheDocument();
    expect(screen.getByText("2025-26")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Regular season" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows an empty state for a season with no stats on file", async () => {
    vi.mocked(fetchTeamStats).mockResolvedValue({
      data: { skaters: [], goalies: [], advanced: { players: [], team: [] } },
      meta: { season: "2025-26", game_type: "regular_season", skater_count: 0, goalie_count: 0 },
    });

    renderStats();

    expect(await screen.findByText("No stats recorded for this season yet.")).toBeInTheDocument();
  });

  it("shows advanced stats for the all/all split by default, and switches split on filter change", async () => {
    vi.mocked(fetchTeamStats).mockResolvedValue({
      data: {
        skaters: TEAM_STATS.data.skaters,
        goalies: TEAM_STATS.data.goalies,
        advanced: {
          players: [
            playerSeasonAdvancedStatFor({
              player: { ...playerSeasonAdvancedStatFor().player, last_name: "AllSituations" },
              strength_state: "all",
              score_state: "all",
            }),
            playerSeasonAdvancedStatFor({
              player: { ...playerSeasonAdvancedStatFor().player, last_name: "FiveOnFive" },
              strength_state: "5v5",
              score_state: "all",
            }),
          ],
          team: [
            teamSeasonAdvancedStatFor({
              strength_state: "all",
              score_state: "all",
              games_played: 10,
            }),
            teamSeasonAdvancedStatFor({
              strength_state: "5v5",
              score_state: "all",
              games_played: 9,
            }),
          ],
        },
      },
      meta: { season: "2025-26", game_type: "regular_season", skater_count: 2, goalie_count: 1 },
    });
    const user = userEvent.setup();

    renderStats();

    expect(await screen.findByText(/AllSituations/)).toBeInTheDocument();
    expect(screen.queryByText(/FiveOnFive/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "5v5" }));

    expect(await screen.findByText(/FiveOnFive/)).toBeInTheDocument();
    expect(screen.queryByText(/AllSituations/)).not.toBeInTheDocument();
  });

  it("refetches with the selected game_type, covering preseason and playoffs too", async () => {
    const user = userEvent.setup();
    renderStats();

    await screen.findByText("2025-26");
    expect(fetchTeamStats).toHaveBeenLastCalledWith(TEAM_WITH_LEAGUE.id, "regular_season");

    await user.click(screen.getByRole("button", { name: "Preseason" }));

    expect(fetchTeamStats).toHaveBeenLastCalledWith(TEAM_WITH_LEAGUE.id, "preseason");
  });
});
