import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PenaltyEvent } from "@/models/gameDetail";
import { playerFor } from "@/test-mocks";
import { GamePenaltyList } from "../GamePenaltyList";

const TEAM_ABBREVS = { 10: "MTL", 20: "TOR" };

function penaltyFor(overrides: Partial<PenaltyEvent>): PenaltyEvent {
  return {
    id: 1,
    type: "penalty",
    period: 1,
    period_time_seconds: 68,
    team_id: 20,
    strength_state: "even_strength",
    committed_by: playerFor(1, { first_name: "Ryan", last_name: "Reaves" }),
    drawn_by: null,
    infraction: "roughing",
    penalty_type: "minor",
    penalty_minutes: 2,
    ...overrides,
  };
}

describe("GamePenaltyList", () => {
  it("shows the offender, minutes, and a humanised infraction", () => {
    render(<GamePenaltyList penalties={[penaltyFor({})]} teamAbbrevById={TEAM_ABBREVS} />);

    expect(screen.getByText("Ryan Reaves")).toBeInTheDocument();
    expect(screen.getByText("2 min, Roughing")).toBeInTheDocument();
  });

  it("labels a bench minor with no individual offender", () => {
    render(
      <GamePenaltyList
        penalties={[
          penaltyFor({
            committed_by: null,
            penalty_type: "bench-minor",
            infraction: "too-many-men-on-the-ice",
          }),
        ]}
        teamAbbrevById={TEAM_ABBREVS}
      />,
    );

    expect(screen.getByText("Bench")).toBeInTheDocument();
    expect(screen.getByText("2 min, Too many men on the ice")).toBeInTheDocument();
  });
});
