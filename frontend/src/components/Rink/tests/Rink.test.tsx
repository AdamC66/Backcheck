import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Rink } from "../Rink";

describe("Rink", () => {
  it("renders the diagram and its overlay children", () => {
    render(
      <Rink>
        <circle data-testid="overlay" cx={1} cy={2} r={3} />
      </Rink>,
    );

    expect(screen.getByRole("img", { name: "Offensive-zone rink diagram" })).toBeInTheDocument();
    expect(screen.getByTestId("overlay")).toBeInTheDocument();
  });
});
