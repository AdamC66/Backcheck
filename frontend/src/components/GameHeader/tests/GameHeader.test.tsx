import { describe, expect, it } from "vitest";
import { gameFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { GameHeader } from "../GameHeader";

describe("GameHeader", () => {
  it("shows both teams, the score, and a Final status for a completed game", () => {
    renderWithProviders(<GameHeader game={gameFor()} statsSyncing={false} />);

    expect(screen.getByText("Anaheim Ducks")).toBeInTheDocument();
    expect(screen.getByText("Boston Bruins")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Final")).toBeInTheDocument();
  });

  it("notes when advanced stats are still recalculating", () => {
    renderWithProviders(<GameHeader game={gameFor()} statsSyncing />);

    expect(screen.getByText(/recalculating for this game/)).toBeInTheDocument();
  });
});
