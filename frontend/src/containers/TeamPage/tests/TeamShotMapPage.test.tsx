import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router";
import { fetchCurrentUser } from "@/models/auth";
import { fetchSeasons } from "@/models/seasons";
import { fetchTeam } from "@/models/teams";
import { fetchTeamShotLocations } from "@/models/teamShotLocations";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { SUPER_ADMIN, TEAM_SHOT_LOCATIONS, TEAM_WITH_LEAGUE, seasonFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { TeamPage } from "../TeamPage";
import { TeamShotMapPage } from "../TeamShotMapPage";

vi.mock("@/models/auth");
vi.mock("@/models/teams");
vi.mock("@/models/seasons");
vi.mock("@/models/teamShotLocations");

function renderShotMap(route = `/teams/${TEAM_WITH_LEAGUE.id}/shots`) {
  renderWithProviders(
    <Routes>
      <Route path="/teams/:id" element={<TeamPage />}>
        <Route path="shots" element={<TeamShotMapPage />} />
      </Route>
    </Routes>,
    { route },
  );
}

describe("TeamShotMapPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    localStorage.setItem(TOKEN_KEY, "test-token");
    vi.mocked(fetchCurrentUser).mockResolvedValue(SUPER_ADMIN);
    vi.mocked(fetchTeam).mockResolvedValue(TEAM_WITH_LEAGUE);
    vi.mocked(fetchSeasons).mockResolvedValue([seasonFor(2, "2025-26")]);
    vi.mocked(fetchTeamShotLocations).mockResolvedValue(TEAM_SHOT_LOCATIONS);
  });

  it("renders the four offense/defense split panels", async () => {
    renderShotMap();

    expect(await screen.findByRole("heading", { name: "Offense · 5v5" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Offense · Power play" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Defense · 5v5" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Defense · Penalty kill" })).toBeInTheDocument();
  });

  it("shows an empty state when no shots are on file", async () => {
    vi.mocked(fetchTeamShotLocations).mockResolvedValue({
      ...TEAM_SHOT_LOCATIONS,
      data: { for: [], against: [] },
    });

    renderShotMap();

    expect(await screen.findByText("No located shots for this season yet.")).toBeInTheDocument();
  });
});
