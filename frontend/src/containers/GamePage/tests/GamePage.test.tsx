import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { fetchGameDetail } from "@/models/gameDetail";
import { fetchGameShots } from "@/models/gameShots";
import { GAME_DETAIL, GAME_SHOTS, TEAMS } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { GamePage } from "../GamePage";
import { GameSheetPage } from "../GameSheetPage";
import { GameStatsPage } from "../GameStatsPage";
import { GameAdvancedStatsPage } from "../GameAdvancedStatsPage";
import { GameChartsPage } from "../GameChartsPage";

vi.mock("@/models/gameDetail");
vi.mock("@/models/gameShots");

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
    vi.mocked(fetchGameShots).mockResolvedValue(GAME_SHOTS);
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

  it("shows the shot map and zone-time charts on the charts tab", async () => {
    renderGame(`/games/${GAME_DETAIL.data.game.id}/charts`);

    expect(await screen.findByRole("heading", { name: "Shot Map" })).toBeInTheDocument();
    expect(await screen.findByText(/circle size = shot quality/)).toBeInTheDocument();
    expect(screen.getByText("3 without coordinates")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Zone Time Share" })).toBeInTheDocument();
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getAllByText(TEAMS[0].abbreviation).length).toBeGreaterThan(0);
  });

  it("filters the shot map to one team", async () => {
    renderGame(`/games/${GAME_DETAIL.data.game.id}/charts`);

    expect(await screen.findByLabelText(/Auston Matthews/)).toBeInTheDocument();
    expect(screen.getByLabelText(/William Nylander/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: TEAMS[0].abbreviation }));

    expect(screen.getByLabelText(/Auston Matthews/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/William Nylander/)).not.toBeInTheDocument();
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
