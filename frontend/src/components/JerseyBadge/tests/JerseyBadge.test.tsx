import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { JerseyBadge } from "../JerseyBadge";

describe("JerseyBadge", () => {
  it("shows the jersey number when one is on file", () => {
    render(<JerseyBadge number={34} fullName="Auston Matthews" />);

    expect(screen.getByText("34")).toBeInTheDocument();
  });

  it("falls back to initials when no number is on file", () => {
    render(<JerseyBadge number={null} fullName="Auston Matthews" />);

    expect(screen.getByText("AM")).toBeInTheDocument();
  });
});
