import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TEAMS } from "@/test-mocks";
import { TeamRail } from "../TeamRail";

describe("TeamRail", () => {
  it("renders every team", () => {
    render(<TeamRail teams={TEAMS} />);

    expect(screen.getByText("Anaheim Ducks")).toBeInTheDocument();
    expect(screen.getByText("Boston Bruins")).toBeInTheDocument();
  });

  it("renders nothing but an empty rail without teams", () => {
    render(<TeamRail teams={[]} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
