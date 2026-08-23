import { describe, expect, it } from "vitest";
import { TEAMS } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { TeamRail } from "../TeamRail";

describe("TeamRail", () => {
  it("renders every team, each linking to its page", () => {
    renderWithProviders(<TeamRail teams={TEAMS} />);

    expect(screen.getByText("Anaheim Ducks")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Boston Bruins/ })).toHaveAttribute(
      "href",
      `/teams/${TEAMS[1].id}`,
    );
  });

  it("renders nothing but an empty rail without teams", () => {
    renderWithProviders(<TeamRail teams={[]} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
