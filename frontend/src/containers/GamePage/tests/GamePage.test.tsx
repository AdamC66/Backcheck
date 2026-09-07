import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { fetchGameDetail } from "@/models/gameDetail";
import { GAME_DETAIL, TEAMS } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { GamePage } from "../GamePage";
import { GameSheetPage } from "../GameSheetPage";
import { GameStatsPage } from "../GameStatsPage";
import { GameAdvancedStatsPage } from "../GameAdvancedStatsPage";
import { GameChartsPage } from "../GameChartsPage";

vi.mock("@/models/gameDetail");

function renderGame(route = `/games/${GAME_DETAIL.data.game.id}`) {
  renderWithProviders(
    <Routes>
      <Route path="/games/:id" element={<GamePage />}>
        <Route index element={<GameSheetPage />} />
        <Route path="stats" element={<GameStatsPage />} />
        <Route path="advanced" element={<GameAdvancedStatsPage />} />
        <Route path="charts" element={<GameChartsPage />} />
      </Route>
    </Routes>,
    { route },
  );
}

describe("GamePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fetchGameDetail).mockResolvedValue(GAME_DETAIL);
  });

  it("shows the matchup header and the gamesheet tab by default", async () => {
    renderGame();

    expect(await screen.findByText("Final")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Goal Summary" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Penalties" })).toBeInTheDocument();
    expect(screen.getByText(/\(M\. Marner\)/)).toBeInTheDocument();
    expect(screen.getByText(/2 min, Tripping/)).toBeInTheDocument();
    expect(screen.getByText(/28\/31 saves/)).toBeInTheDocument();
  });

  it("shows one team's full stat tables on the stats tab, switchable by side", async () => {
    renderGame(`/games/${GAME_DETAIL.data.game.id}/stats`);

    // Away team (BOS) is selected by default.
    expect(
      await screen.findByRole("heading", { name: /Boston Bruins — Skaters/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("William Nylander")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /ANA \[Home\]/ }));

    expect(
      await screen.findByRole("heading", { name: /Anaheim Ducks — Skaters/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Auston Matthews")).toBeInTheDocument();
  });

  it("shows the team comparison and per-player advanced tables on the advanced tab", async () => {
    renderGame(`/games/${GAME_DETAIL.data.game.id}/advanced`);

    expect(await screen.findByRole("heading", { name: "Team Comparison" })).toBeInTheDocument();
    expect(screen.getByText("Corsi for")).toBeInTheDocument();
  });

  it("shows the zone-time charts on the charts tab", async () => {
    renderGame(`/games/${GAME_DETAIL.data.game.id}/charts`);

    expect(await screen.findByRole("heading", { name: "Zone Time Share" })).toBeInTheDocument();
    expect(screen.getByText("P1")).toBeInTheDocument();
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
