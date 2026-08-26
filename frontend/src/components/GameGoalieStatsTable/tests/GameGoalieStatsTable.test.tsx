import { describe, expect, it } from "vitest";
import { goalieGameStatFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { GameGoalieStatsTable } from "../GameGoalieStatsTable";

describe("GameGoalieStatsTable", () => {
  it("renders a goalie's decision and save percentage", () => {
    const stats = [
      goalieGameStatFor({
        player: { ...goalieGameStatFor().player, first_name: "Anthony", last_name: "Stolarz" },
        saves: 30,
        shots_against: 32,
        save_pctg: 0.9375,
        decision: "W",
      }),
    ];

    renderWithProviders(<GameGoalieStatsTable stats={stats} />);

    expect(screen.getByText("Anthony Stolarz")).toBeInTheDocument();
    expect(screen.getByText("W")).toBeInTheDocument();
    expect(screen.getByText(".938")).toBeInTheDocument();
  });

  it("renders an em dash for a goalie with no decision yet", () => {
    renderWithProviders(<GameGoalieStatsTable stats={[goalieGameStatFor({ decision: null })]} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
