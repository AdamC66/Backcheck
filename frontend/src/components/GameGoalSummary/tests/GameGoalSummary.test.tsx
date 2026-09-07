import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { GoalEvent } from "@/models/gameDetail";
import { playerFor } from "@/test-mocks";
import { GameGoalSummary } from "../GameGoalSummary";

const TEAM_ABBREVS = { 10: "MTL", 20: "TOR" };

function goalFor(overrides: Partial<GoalEvent>): GoalEvent {
  return {
    id: 1,
    type: "goal",
    period: 1,
    period_time_seconds: 125,
    team_id: 20,
    strength_state: "even_strength",
    scorer: playerFor(1, { first_name: "Auston", last_name: "Matthews" }),
    assists: [playerFor(2, { first_name: "Mitch", last_name: "Marner" })],
    ...overrides,
  };
}

describe("GameGoalSummary", () => {
  it("groups goals by period and shows scorer, assists, clock, and a power-play badge", () => {
    render(
      <GameGoalSummary
        goals={[
          goalFor({ id: 1, period: 1, period_time_seconds: 125 }),
          goalFor({
            id: 2,
            period: 2,
            period_time_seconds: 44,
            strength_state: "power_play",
            assists: [],
          }),
        ]}
        teamAbbrevById={TEAM_ABBREVS}
      />,
    );

    expect(screen.getByText("1st")).toBeInTheDocument();
    expect(screen.getByText("2nd")).toBeInTheDocument();
    expect(screen.getByText("2:05")).toBeInTheDocument();
    expect(screen.getByText("(M. Marner)")).toBeInTheDocument();
    expect(screen.getByText("(unassisted)")).toBeInTheDocument();
    expect(screen.getByText("PP")).toBeInTheDocument();
  });

  it("shows an empty-state message when there are no goals", () => {
    render(<GameGoalSummary goals={[]} teamAbbrevById={TEAM_ABBREVS} />);

    expect(screen.getByText(/No goals recorded/)).toBeInTheDocument();
  });
});
