import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router";
import { fetchGameDetail } from "@/models/gameDetail";
import { GAME_DETAIL, TEAMS } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { GamePage } from "../GamePage";

vi.mock("@/models/gameDetail");

function renderGame() {
  renderWithProviders(
    <Routes>
      <Route path="/games/:id" element={<GamePage />} />
    </Routes>,
    { route: `/games/${GAME_DETAIL.data.game.id}` },
  );
}

describe("GamePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fetchGameDetail).mockResolvedValue(GAME_DETAIL);
  });

  it("shows the matchup, basic stats, and advanced stats for both teams", async () => {
    renderGame();

    // Appears in the skater table, per-player advanced table, zone-time table, and goal summary.
    expect((await screen.findAllByText("Auston Matthews")).length).toBe(4);
    expect(screen.getAllByText("William Nylander").length).toBeGreaterThan(0);
    expect(screen.getByText("Anthony Stolarz")).toBeInTheDocument();
    expect(screen.getAllByText(TEAMS[0].abbreviation).length).toBeGreaterThan(0);
  });

  it("shows the zone-occupancy strip and per-skater zone time", async () => {
    renderGame();

    expect(await screen.findByText("Zone time")).toBeInTheDocument();
    expect(screen.getByText("P1")).toBeInTheDocument();
  });

  it("shows the boxscore: goal summary, penalties, scoring by period, and a goalie decision line", async () => {
    renderGame();

    expect(await screen.findByText("Goal summary")).toBeInTheDocument();
    expect(screen.getByText("Penalties")).toBeInTheDocument();
    expect(screen.getByText("Scoring by period")).toBeInTheDocument();
    expect(screen.getByText(/\(M\. Marner\)/)).toBeInTheDocument();
    expect(screen.getByText(/2 min, Tripping/)).toBeInTheDocument();
    expect(screen.getByText(/28\/31 saves/)).toBeInTheDocument();
  });

  it("shows a syncing notice when the game is mid-recalculation", async () => {
    vi.mocked(fetchGameDetail).mockResolvedValue({ ...GAME_DETAIL, meta: { stats_syncing: true } });

    renderGame();

    expect(
      await screen.findByText(/Advanced stats are recalculating for this game/),
    ).toBeInTheDocument();
  });

  it("shows an error state when the game fails to load", async () => {
    vi.mocked(fetchGameDetail).mockRejectedValue(new Error("boom"));

    renderGame();

    expect(await screen.findByText("Could not load this game.")).toBeInTheDocument();
  });
});
