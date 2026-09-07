import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { goalieGameStatFor } from "@/test-mocks";
import { GameGoalieDecisionLine } from "../GameGoalieDecisionLine";

describe("GameGoalieDecisionLine", () => {
  it("shows each goalie's decision, save line, and save percentage, decision first", () => {
    render(
      <GameGoalieDecisionLine
        goalies={[
          goalieGameStatFor({
            player: {
              ...goalieGameStatFor().player,
              id: 1,
              first_name: "Sam",
              last_name: "Montembeault",
            },
            decision: null,
            starter: false,
            saves: 5,
            shots_against: 6,
            save_pctg: 0.8333,
          }),
          goalieGameStatFor({
            player: {
              ...goalieGameStatFor().player,
              id: 2,
              first_name: "Anthony",
              last_name: "Stolarz",
            },
            decision: "W",
            saves: 30,
            shots_against: 32,
            save_pctg: 0.9375,
          }),
        ]}
      />,
    );

    const lines = screen.getAllByText(/saves ·/).map((node) => node.closest("div")?.textContent);
    expect(lines[0]).toContain("A. Stolarz");
    expect(lines[0]).toContain("W");
    expect(screen.getByText("30/32 saves · .938")).toBeInTheDocument();
  });

  it("renders nothing without any goalies", () => {
    const { container } = render(<GameGoalieDecisionLine goalies={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
