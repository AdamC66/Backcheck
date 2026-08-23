import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { teamGame } from "@/lib/teamSchedule";
import { gameFor } from "@/test-mocks";
import { GameSummaryCard } from "../GameSummaryCard";

describe("GameSummaryCard", () => {
  it("lists the given games under the title", () => {
    const entry = teamGame(gameFor(), 1);

    render(<GameSummaryCard title="Last 3 games" games={[entry]} emptyLabel="No games." />);

    expect(screen.getByText("Last 3 games")).toBeInTheDocument();
    expect(screen.getByText("Boston Bruins")).toBeInTheDocument();
  });

  it("shows the empty label instead of a list when there are no games", () => {
    render(<GameSummaryCard title="Next 3 games" games={[]} emptyLabel="No games scheduled." />);

    expect(screen.getByText("No games scheduled.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
