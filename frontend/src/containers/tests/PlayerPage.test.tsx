import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router";
import userEvent from "@testing-library/user-event";
import { fetchPlayerDetail } from "@/models/playerDetail";
import { PLAYER_DETAIL, playerAdvancedSeasonFor, seasonFor, teamFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { PlayerPage } from "../PlayerPage";

vi.mock("@/models/playerDetail");

function renderPlayer() {
  renderWithProviders(
    <Routes>
      <Route path="/players/:id" element={<PlayerPage />} />
    </Routes>,
    { route: `/players/${PLAYER_DETAIL.data.player.id}` },
  );
}

describe("PlayerPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fetchPlayerDetail).mockResolvedValue(PLAYER_DETAIL);
  });

  it("shows the player's name and season-by-season basic and advanced stats", async () => {
    renderPlayer();

    expect(await screen.findByText("Auston Matthews")).toBeInTheDocument();
    // "24-25" is unique to the skater table; "25-26" also appears in the advanced table.
    expect(screen.getByText("24-25")).toBeInTheDocument();
    expect(screen.getAllByText("25-26").length).toBe(2);
    expect(screen.getAllByText("TOR").length).toBeGreaterThan(0);
  });

  it("shows an empty state when a player has no stats on file yet", async () => {
    vi.mocked(fetchPlayerDetail).mockResolvedValue({
      data: {
        player: PLAYER_DETAIL.data.player,
        current_team: null,
        skater_seasons: [],
        goalie_seasons: [],
        advanced_seasons: [],
      },
      meta: { game_type: "regular_season" },
    });

    renderPlayer();

    expect(await screen.findByText("No stats recorded for this player yet.")).toBeInTheDocument();
  });

  // The bug this guards against: deriving "current team" from stat rows leaves a
  // rostered-but-never-played (or not-yet-played) player with no team shown at all.
  it("still shows the player's roster team when they haven't recorded any stats yet", async () => {
    vi.mocked(fetchPlayerDetail).mockResolvedValue({
      data: {
        player: PLAYER_DETAIL.data.player,
        current_team: teamFor(2, "BOS"),
        skater_seasons: [],
        goalie_seasons: [],
        advanced_seasons: [],
      },
      meta: { game_type: "regular_season" },
    });

    renderPlayer();

    expect(await screen.findByText("No stats recorded for this player yet.")).toBeInTheDocument();
    expect(screen.getByText(/BOS Club/)).toBeInTheDocument();
  });

  it("switches the advanced split when a strength-state filter is clicked", async () => {
    // Distinct seasons from PLAYER_DETAIL's skater table, so assertions here can't
    // collide with season labels rendered by that unrelated table.
    vi.mocked(fetchPlayerDetail).mockResolvedValue({
      data: {
        ...PLAYER_DETAIL.data,
        advanced_seasons: [
          playerAdvancedSeasonFor({
            season: seasonFor(3, "22-23"),
            team: teamFor(1, "TOR"),
            strength_state: "all",
          }),
          playerAdvancedSeasonFor({
            season: seasonFor(4, "23-24"),
            team: teamFor(1, "TOR"),
            strength_state: "5v5",
          }),
        ],
      },
      meta: { game_type: "regular_season" },
    });
    const user = userEvent.setup();

    renderPlayer();

    expect(await screen.findByText("22-23")).toBeInTheDocument();
    expect(screen.queryByText("23-24")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "5v5" }));

    expect(await screen.findByText("23-24")).toBeInTheDocument();
    expect(screen.queryByText("22-23")).not.toBeInTheDocument();
  });
});
