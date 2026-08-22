import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TEAMS } from "@/test-mocks";
import { TeamCard } from "../TeamCard";

describe("TeamCard", () => {
  it("renders the logo URL the API supplied", () => {
    render(<TeamCard team={TEAMS[0]} />);

    expect(screen.getByRole("img", { name: "Anaheim Ducks logo" })).toHaveAttribute(
      "src",
      TEAMS[0].logo_url,
    );
  });

  it("falls back to the abbreviation for a team with no logo", () => {
    render(<TeamCard team={TEAMS[1]} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getAllByText("BOS")).not.toHaveLength(0);
  });
});
