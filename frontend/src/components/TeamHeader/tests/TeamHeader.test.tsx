import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TEAMS } from "@/test-mocks";
import { TeamHeader } from "../TeamHeader";

describe("TeamHeader", () => {
  it("names the team and shows its logo", () => {
    render(<TeamHeader team={TEAMS[0]} />);

    expect(screen.getByRole("heading", { name: "Anaheim Ducks" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Anaheim Ducks logo" })).toBeInTheDocument();
  });

  it("takes its colours from the surrounding theme rather than props", () => {
    const { container } = render(<TeamHeader team={TEAMS[0]} />);

    expect(container.firstChild).toHaveClass("bg-team-primary", "text-team-contrast");
  });
});
