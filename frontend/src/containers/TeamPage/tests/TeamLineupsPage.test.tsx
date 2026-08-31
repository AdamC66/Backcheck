import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { fetchCurrentUser } from "@/models/auth";
import { fetchTeamGames } from "@/models/games";
import { fetchLineup, setLineup } from "@/models/lineups";
import { fetchTeamRoster } from "@/models/roster";
import { fetchSeasons } from "@/models/seasons";
import { fetchTeam } from "@/models/teams";
import { ApiError } from "@/lib/apiClient";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import {
  SUPER_ADMIN,
  TEAM_GAMES,
  TEAM_ROSTER,
  TEAM_WITH_LEAGUE,
  TEAMS,
  lineupFor,
} from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { TeamPage } from "../TeamPage";
import { TeamLineupsPage } from "../TeamLineupsPage";

vi.mock("@/models/auth");
vi.mock("@/models/games");
vi.mock("@/models/lineups");
vi.mock("@/models/roster");
vi.mock("@/models/seasons");
vi.mock("@/models/teams");

function renderLineups(route = `/teams/${TEAMS[0].id}/lineups`) {
  renderWithProviders(
    <Routes>
      <Route path="/teams/:id" element={<TeamPage />}>
        <Route path="lineups" element={<TeamLineupsPage />} />
      </Route>
    </Routes>,
    { route },
  );
}

describe("TeamLineupsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    localStorage.setItem(TOKEN_KEY, "test-token");
    vi.mocked(fetchCurrentUser).mockResolvedValue(SUPER_ADMIN);
    vi.mocked(fetchTeam).mockResolvedValue(TEAM_WITH_LEAGUE);
    vi.mocked(fetchTeamGames).mockResolvedValue(TEAM_GAMES);
    vi.mocked(fetchTeamRoster).mockResolvedValue(TEAM_ROSTER);
    vi.mocked(fetchSeasons).mockResolvedValue([]);
  });

  it("shows the selected game's lineup", async () => {
    vi.mocked(fetchLineup).mockResolvedValue(lineupFor({ historical: true }));

    renderLineups();

    expect(await screen.findByText("Test Matthews")).toBeInTheDocument();
    expect(screen.getByText("Test Stolarz")).toBeInTheDocument();
  });

  it("explains when no lineup was recorded for a finished game", async () => {
    vi.mocked(fetchLineup).mockRejectedValue(new ApiError("not_found", "Lineup not found", 404));

    renderLineups();

    expect(await screen.findByText(/No lineup was recorded/)).toBeInTheDocument();
  });

  it("opens the editor for a super admin and saves", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchLineup).mockRejectedValue(new ApiError("not_found", "Lineup not found", 404));
    vi.mocked(setLineup).mockResolvedValue(lineupFor());

    renderLineups();

    await user.click(await screen.findByRole("button", { name: "Edit lineup" }));

    // The editor's slot buttons replace the read-only sheet.
    expect(await screen.findByRole("button", { name: "L1 LW — add player" })).toBeInTheDocument();
  });
});
