import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";
import { STANDINGS } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { StandingsTable } from "../StandingsTable";

describe("StandingsTable", () => {
  it("renders a row per team, in the order given", () => {
    renderWithProviders(<StandingsTable standings={STANDINGS.data} />);

    const rows = screen.getAllByRole("row").slice(1);

    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByRole("rowheader")).toHaveTextContent("Anaheim Ducks");
    expect(within(rows[0]).getByText("121")).toBeInTheDocument();
  });

  it("ranks by the sequence it's given, with a prefix when asked", () => {
    renderWithProviders(
      <StandingsTable
        standings={STANDINGS.data}
        rankKey="wildcard_sequence"
        rankPrefix="WC"
        cutlineAfter={0}
      />,
    );

    const rows = screen.getAllByRole("row").slice(1);

    expect(within(rows[0]).getByText("WC0")).toBeInTheDocument();
    expect(screen.getByText("Playoff cut")).toBeInTheDocument();
  });

  it("links each team through to its page", () => {
    renderWithProviders(<StandingsTable standings={STANDINGS.data} />);

    expect(screen.getByRole("link", { name: /Anaheim Ducks/ })).toHaveAttribute(
      "href",
      `/teams/${STANDINGS.data[0].team.id}`,
    );
  });
});
