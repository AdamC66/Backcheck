import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionHeading } from "../SectionHeading";

describe("SectionHeading", () => {
  it("renders a heading with an optional aside", () => {
    render(<SectionHeading aside="5 goals">Goal Summary</SectionHeading>);

    expect(screen.getByRole("heading", { name: "Goal Summary" })).toBeInTheDocument();
    expect(screen.getByText("5 goals")).toBeInTheDocument();
  });

  it("renders an h3 when asked", () => {
    render(<SectionHeading as="h3">Skaters</SectionHeading>);

    expect(screen.getByRole("heading", { level: 3, name: "Skaters" })).toBeInTheDocument();
  });
});
