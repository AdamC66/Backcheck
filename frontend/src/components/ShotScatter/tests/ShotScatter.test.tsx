import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GAME_SHOTS } from "@/test-mocks";
import { ShotScatter } from "../ShotScatter";

describe("ShotScatter", () => {
  it("labels a circle per shot and marks goals with a stroke", () => {
    render(
      <ShotScatter shots={GAME_SHOTS.data} homeLabel="ANA" awayLabel="BOS" unlocatedCount={3} />,
    );

    const goal = screen.getByLabelText(/Auston Matthews, wrist — GOAL/);
    expect(goal.getAttribute("stroke")).toBe("white");

    const miss = screen.getByLabelText(/William Nylander, slap/);
    expect(miss.getAttribute("stroke")).toBe("none");

    expect(screen.getByText("3 without coordinates")).toBeInTheDocument();
    expect(screen.getByText("ANA")).toBeInTheDocument();
  });

  it("shows a tooltip on hover", async () => {
    render(<ShotScatter shots={GAME_SHOTS.data} homeLabel="ANA" awayLabel="BOS" />);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await userEvent.hover(screen.getByLabelText(/Auston Matthews, wrist — GOAL/));

    expect(screen.getByRole("tooltip")).toHaveTextContent("Auston Matthews, wrist — GOAL");
  });
});
