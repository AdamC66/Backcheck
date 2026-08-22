import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { STANDINGS } from "@/test-mocks";
import { StandingsTable } from "../StandingsTable";

describe("StandingsTable", () => {
  it("renders a row per team, in the order given", () => {
    render(<StandingsTable standings={STANDINGS.data} />);

    const rows = screen.getAllByRole("row").slice(1);

    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByRole("rowheader")).toHaveTextContent("Anaheim Ducks");
    expect(within(rows[0]).getByText("121")).toBeInTheDocument();
  });

  it("signs the goal differential so a positive one reads as a gain", () => {
    render(<StandingsTable standings={STANDINGS.data} />);

    expect(screen.getByText("+99")).toBeInTheDocument();
    expect(screen.getByText("-46")).toBeInTheDocument();
  });

  it("ranks by the sequence it's given, with a prefix when asked", () => {
    render(
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
    render(<StandingsTable standings={STANDINGS.data} />);

    expect(screen.queryByText("Playoff cut")).not.toBeInTheDocument();
  });

  it("formats the streak and points percentage the way a standings table does", () => {
    render(<StandingsTable standings={STANDINGS.data} />);

    expect(screen.getByText("W3")).toBeInTheDocument();
    expect(screen.getByText("L1")).toBeInTheDocument();
    expect(screen.getAllByText(".652")).not.toHaveLength(0);
  });
});
