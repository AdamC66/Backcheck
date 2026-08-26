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

    // Appears in both the skater table and the per-player advanced table.
    expect((await screen.findAllByText("Auston Matthews")).length).toBe(2);
    expect(screen.getByText("William Nylander")).toBeInTheDocument();
    expect(screen.getByText("Anthony Stolarz")).toBeInTheDocument();
    expect(screen.getAllByText(TEAMS[0].abbreviation).length).toBeGreaterThan(0);
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
