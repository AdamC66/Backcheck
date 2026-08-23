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

vi.mock("@/models/auth");
vi.mock("@/models/games");
vi.mock("@/models/leagues");
vi.mock("@/models/standings");

function renderAtSlug(slug: string) {
  renderWithProviders(
    <Routes>
      <Route path="/leagues/:slug" element={<LeaguePage />} />
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

  it("lists the league's teams", async () => {
    renderAtSlug("nhl");

    expect(await screen.findByRole("heading", { name: "Teams" })).toBeInTheDocument();
    expect(await screen.findAllByText("Boston Bruins")).not.toHaveLength(0);
    expect(fetchLeague).toHaveBeenCalledWith("nhl");
  });

  it("groups by the view named in the URL", async () => {
    renderAtSlug("nhl?view=division");

    expect(await screen.findByRole("button", { name: "Division" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // The fixture's two teams share a division, so grouping puts them under its heading.
    expect(screen.getByText("Central")).toBeInTheDocument();
  });

  it("surfaces a league the user can't see", async () => {
    vi.mocked(fetchLeague).mockRejectedValue(new ApiError("not_found", "League not found", 404));

    renderAtSlug("nhl");

    expect(await screen.findByText("Could not load this league.")).toBeInTheDocument();
  });

  it("pages the ticker backwards without disturbing the standings view", async () => {
    renderAtSlug("nhl?view=wildcard");
    await screen.findByText("Apr 15");

    await userEvent.click(screen.getByRole("button", { name: /earlier games/i }));

    expect(fetchLeagueGames).toHaveBeenLastCalledWith("nhl", {
      date: "2026-04-14",
      direction: "backward",
    });
    expect(screen.getByRole("button", { name: "Wild Card" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
