import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { fetchCurrentUser } from "@/models/auth";
import { fetchTeamGames } from "@/models/games";
import { fetchSeasons } from "@/models/seasons";
import { fetchTeam } from "@/models/teams";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { seasonFor, SUPER_ADMIN, TEAM_GAMES, TEAM_WITH_LEAGUE, TEAMS } from "@/test-mocks";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { TeamPage } from "../TeamPage";
import { TeamSchedulePage } from "../TeamSchedulePage";

vi.mock("@/models/auth");
vi.mock("@/models/games");
vi.mock("@/models/seasons");
vi.mock("@/models/teams");

function renderSchedule(route = `/teams/${TEAMS[0].id}/schedule`) {
  renderWithProviders(
    <Routes>
      <Route path="/teams/:id" element={<TeamPage />}>
        <Route path="schedule" element={<TeamSchedulePage />} />
      </Route>
    </Routes>,
    { route },
  );
}

describe("TeamSchedulePage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    localStorage.setItem(TOKEN_KEY, "test-token");
    vi.mocked(fetchCurrentUser).mockResolvedValue(SUPER_ADMIN);
    vi.mocked(fetchTeam).mockResolvedValue(TEAM_WITH_LEAGUE);
    vi.mocked(fetchTeamGames).mockResolvedValue(TEAM_GAMES);
    vi.mocked(fetchSeasons).mockResolvedValue([seasonFor(2, "2025-26"), seasonFor(1, "2024-25")]);
  });

  it("lists the schedule under month headings", async () => {
    renderSchedule();

    expect(await screen.findByText(/October 2025/)).toBeInTheDocument();
    expect(screen.getByText(/November 2025/)).toBeInTheDocument();
  });

  it("switches season through the URL, keeping the game-type filter", async () => {
    renderSchedule(`/teams/${TEAMS[0].id}/schedule?type=regular_season`);

    await screen.findByText(/October 2025/);
    await userEvent.selectOptions(await screen.findByLabelText("Season"), "2024-25");

    await waitFor(() =>
      expect(fetchTeamGames).toHaveBeenLastCalledWith(TEAMS[0].id, {
        season: "2024-25",
        gameType: "regular_season",
      }),
    );
  });

  it("filters to the regular season through the URL", async () => {
    renderSchedule(`/teams/${TEAMS[0].id}/schedule?type=regular_season`);

    await screen.findByText(/October 2025/);

    expect(fetchTeamGames).toHaveBeenCalledWith(TEAMS[0].id, { gameType: "regular_season" });
    expect(screen.getByRole("button", { name: "Regular season" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
