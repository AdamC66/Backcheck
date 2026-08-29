import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { fetchLeagueGames } from "@/models/games";
import { fetchLeague } from "@/models/leagues";
import { LEAGUE_GAMES, LEAGUE_WITH_TEAMS } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { LeagueOverviewPage } from "../LeagueOverviewPage";

vi.mock("@/models/games");
vi.mock("@/models/leagues");

function renderOverview() {
  renderWithProviders(
    <Routes>
      <Route path="/leagues/:slug" element={<LeagueOverviewPage />} />
    </Routes>,
    { route: "/leagues/nhl" },
  );
}

describe("LeagueOverviewPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fetchLeague).mockResolvedValue(LEAGUE_WITH_TEAMS);
    vi.mocked(fetchLeagueGames).mockResolvedValue(LEAGUE_GAMES);
  });

  it("lists the league's teams", async () => {
    renderOverview();

    expect(await screen.findByRole("heading", { name: "Teams" })).toBeInTheDocument();
    expect(await screen.findAllByText("Boston Bruins")).not.toHaveLength(0);
    expect(fetchLeague).toHaveBeenCalledWith("nhl");
  });

  it("pages the ticker backwards", async () => {
    renderOverview();
    await screen.findByText("Apr 15");

    await userEvent.click(screen.getByRole("button", { name: /earlier games/i }));

    expect(fetchLeagueGames).toHaveBeenLastCalledWith("nhl", {
      date: "2026-04-14",
      direction: "backward",
    });
  });
});
