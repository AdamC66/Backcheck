import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { GamePeriodSummary } from "@/models/gameDetail";
import { GamePeriodScoreTable } from "../GamePeriodScoreTable";

const SUMMARY: GamePeriodSummary = {
  periods: [
    { period: 1, away: { goals: 0, shots_on_goal: 8 }, home: { goals: 1, shots_on_goal: 12 } },
    { period: 2, away: { goals: 2, shots_on_goal: 11 }, home: { goals: 1, shots_on_goal: 9 } },
  ],
  totals: { away: { goals: 2, shots_on_goal: 19 }, home: { goals: 2, shots_on_goal: 21 } },
};

describe("GamePeriodScoreTable", () => {
  it("shows a period column per period, a total column, and each team's goals and shots", () => {
    render(<GamePeriodScoreTable summary={SUMMARY} awayLabel="MTL" homeLabel="TOR" />);

    expect(screen.getByText("1st")).toBeInTheDocument();
    expect(screen.getByText("2nd")).toBeInTheDocument();
    expect(screen.getByText("T")).toBeInTheDocument();

    const awayRow = screen.getByRole("row", { name: /MTL/ });
    expect(within(awayRow).getByText("19")).toBeInTheDocument();
    const homeRow = screen.getByRole("row", { name: /TOR/ });
    expect(within(homeRow).getByText("21")).toBeInTheDocument();
  });

  it("renders nothing when no period has data", () => {
    const { container } = render(
      <GamePeriodScoreTable
        summary={{ periods: [], totals: SUMMARY.totals }}
        awayLabel="MTL"
        homeLabel="TOR"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
