import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { teamGameAdvancedStatFor, TEAMS } from "@/test-mocks";
import { GameTeamAdvancedTable } from "../GameTeamAdvancedTable";

describe("GameTeamAdvancedTable", () => {
  it("shows one column per team and a CF% that sums to 100 across them", () => {
    render(
      <GameTeamAdvancedTable
        awayLabel={TEAMS[1].abbreviation}
        homeLabel={TEAMS[0].abbreviation}
        away={teamGameAdvancedStatFor({ team_id: TEAMS[1].id, corsi_for: 40, corsi_against: 60 })}
        home={teamGameAdvancedStatFor({ team_id: TEAMS[0].id, corsi_for: 60, corsi_against: 40 })}
      />,
    );

    expect(screen.getByText("40.0%")).toBeInTheDocument();
    expect(screen.getByText("60.0%")).toBeInTheDocument();
  });

  it("renders nothing when a team's stats are missing", () => {
    const { container } = render(
      <GameTeamAdvancedTable awayLabel="BOS" homeLabel="ANA" away={undefined} home={undefined} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
