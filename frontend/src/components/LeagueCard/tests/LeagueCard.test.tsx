import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LEAGUES } from "@/test-mocks";
import { LeagueCard } from "../LeagueCard";

describe("LeagueCard", () => {
  it("shows the league's name and logo", () => {
    render(<LeagueCard league={LEAGUES[0]} />);

    expect(screen.getByText("National Hockey League")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "National Hockey League logo" })).toHaveAttribute(
      "src",
      LEAGUES[0].logo_url,
    );
  });

  it("falls back to the abbreviation when a league has no logo", () => {
    render(<LeagueCard league={{ ...LEAGUES[0], logo_url: null }} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getAllByText("NHL")).not.toHaveLength(0);
  });
});
