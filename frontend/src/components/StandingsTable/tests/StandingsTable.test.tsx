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

  it("signs the goal differential so a positive one reads as a gain", () => {
    renderWithProviders(<StandingsTable standings={STANDINGS.data} />);

    expect(screen.getByText("+99")).toBeInTheDocument();
    expect(screen.getByText("-46")).toBeInTheDocument();
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

  it("draws no cut line unless one is asked for", () => {
    renderWithProviders(<StandingsTable standings={STANDINGS.data} />);

    expect(screen.queryByText("Playoff cut")).not.toBeInTheDocument();
  });

  it("formats the streak and points percentage the way a standings table does", () => {
    renderWithProviders(<StandingsTable standings={STANDINGS.data} />);

    expect(screen.getByText("W3")).toBeInTheDocument();
    expect(screen.getByText("L1")).toBeInTheDocument();
    expect(screen.getAllByText(".652")).not.toHaveLength(0);
  });

  it("links each team through to its page", () => {
    renderWithProviders(<StandingsTable standings={STANDINGS.data} />);

    expect(screen.getByRole("link", { name: /Anaheim Ducks/ })).toHaveAttribute(
      "href",
      `/teams/${STANDINGS.data[0].team.id}`,
    );
  });
});
