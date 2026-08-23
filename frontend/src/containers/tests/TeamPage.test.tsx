import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { fetchCurrentUser } from "@/models/auth";
import { fetchTeamGames } from "@/models/games";
import { fetchTeam } from "@/models/teams";
import { ApiError } from "@/lib/apiClient";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { SUPER_ADMIN, TEAM_GAMES, TEAM_WITH_LEAGUE, TEAMS } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { TeamPage } from "../TeamPage";

vi.mock("@/models/auth");
vi.mock("@/models/games");
vi.mock("@/models/teams");

function renderTeam(route = `/teams/${TEAMS[0].id}`) {
  renderWithProviders(
    <Routes>
      <Route path="/teams/:id" element={<TeamPage />} />
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

  it("lists the schedule under month headings", async () => {
    renderTeam();

    expect(await screen.findByText(/October 2025/)).toBeInTheDocument();
    expect(screen.getByText(/November 2025/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Anaheim Ducks" })).toBeInTheDocument();
  });

  it("shows each result from this team's perspective", async () => {
    renderTeam();

    expect(await screen.findByText("W")).toBeInTheDocument();
    expect(screen.getByText("5–2")).toBeInTheDocument();
    expect(screen.getByText("OTL")).toBeInTheDocument();
    expect(screen.getByText("3–4 (OT)")).toBeInTheDocument();
  });

  it("goes back to the team's league, not the league list", async () => {
    renderTeam();

    const back = await screen.findByRole("link", { name: /National Hockey League/ });

    expect(back).toHaveAttribute("href", "/leagues/nhl");
  });

  it("falls back to the league list before the team has loaded", () => {
    renderTeam();

    expect(screen.getByRole("link", { name: /All leagues/ })).toHaveAttribute("href", "/");
  });

  it("filters to the regular season through the URL", async () => {
    renderTeam(`/teams/${TEAMS[0].id}?type=regular_season`);

    await screen.findByText(/October 2025/);

    expect(fetchTeamGames).toHaveBeenCalledWith(TEAMS[0].id, { gameType: "regular_season" });
    expect(screen.getByRole("button", { name: "Regular season" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("switches the filter without a page navigation", async () => {
    renderTeam();
    await screen.findByText(/October 2025/);

    await userEvent.click(screen.getByRole("button", { name: "Regular season" }));

    expect(fetchTeamGames).toHaveBeenLastCalledWith(TEAMS[0].id, { gameType: "regular_season" });
  });

  it("surfaces a team the caller can't see", async () => {
    vi.mocked(fetchTeam).mockRejectedValue(new ApiError("not_found", "Team not found", 404));
    vi.mocked(fetchTeamGames).mockRejectedValue(new ApiError("not_found", "Team not found", 404));

    renderTeam();

    expect(await screen.findByText("Could not load this team.")).toBeInTheDocument();
  });
});
