import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { fetchCurrentUser } from "@/models/auth";
import { fetchLeagueGames } from "@/models/games";
import { fetchLeague } from "@/models/leagues";
import { fetchStandings } from "@/models/standings";
import { ApiError } from "@/lib/apiClient";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { LEAGUE_GAMES, LEAGUE_WITH_TEAMS, STANDINGS, SUPER_ADMIN } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { LeaguePage } from "../LeaguePage";
import { LeagueOverviewPage } from "../LeagueOverviewPage";
import { LeagueStandingsPage } from "../LeagueStandingsPage";
import { LeagueStatsPage } from "../LeagueStatsPage";

vi.mock("@/models/auth");
vi.mock("@/models/games");
vi.mock("@/models/leagues");
vi.mock("@/models/standings");
vi.mock("@/models/tableSchema");
vi.mock("@/models/serverTable");

function renderAtSlug(slug: string) {
  renderWithProviders(
    <Routes>
      <Route path="/leagues/:slug" element={<LeaguePage />}>
        <Route index element={<LeagueOverviewPage />} />
        <Route path="standings" element={<LeagueStandingsPage />} />
        <Route path="stats" element={<LeagueStatsPage />} />
      </Route>
    </Routes>,
    { route: `/leagues/${slug}` },
  );
}

describe("LeaguePage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    localStorage.setItem(TOKEN_KEY, "test-token");
    vi.mocked(fetchCurrentUser).mockResolvedValue(SUPER_ADMIN);
    vi.mocked(fetchLeague).mockResolvedValue(LEAGUE_WITH_TEAMS);
    vi.mocked(fetchStandings).mockResolvedValue(STANDINGS);
    vi.mocked(fetchLeagueGames).mockResolvedValue(LEAGUE_GAMES);
  });

  it("shows the three sections in the sidebar and navigates between them", async () => {
    renderAtSlug("nhl");

    expect(await screen.findByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await userEvent.click(screen.getByRole("link", { name: "Standings" }));
    expect(await screen.findByRole("heading", { name: "Standings" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("link", { name: "Stats" }));
    expect(await screen.findByRole("heading", { name: "Stats" })).toBeInTheDocument();
  });

  it("surfaces a league the user can't see", async () => {
    vi.mocked(fetchLeague).mockRejectedValue(new ApiError("not_found", "League not found", 404));

    renderAtSlug("nhl");

    expect(await screen.findByText("Could not load this league.")).toBeInTheDocument();
  });
});
