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

  it("shows a subtitle when given one", () => {
    render(<TeamHeader team={TEAMS[0]} subtitle="2025-26 season" />);

    expect(screen.getByText("2025-26 season")).toBeInTheDocument();
  });

  it("renders before the team has loaded", () => {
    render(<TeamHeader team={undefined} />);

    expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
