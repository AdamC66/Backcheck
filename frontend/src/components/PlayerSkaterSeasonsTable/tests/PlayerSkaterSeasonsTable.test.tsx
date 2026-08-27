import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";
import { playerSkaterSeasonFor, seasonFor, teamFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { PlayerSkaterSeasonsTable } from "../PlayerSkaterSeasonsTable";

describe("PlayerSkaterSeasonsTable", () => {
  it("shows one row per season, in the given order, with the team played for", () => {
    const seasons = [
      playerSkaterSeasonFor({ season: seasonFor(1, "24-25"), team: teamFor(1, "TOR"), goals: 40 }),
      playerSkaterSeasonFor({ season: seasonFor(2, "25-26"), team: teamFor(2, "BOS"), goals: 5 }),
    ];

    renderWithProviders(<PlayerSkaterSeasonsTable seasons={seasons} />);

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByRole("rowheader")).toHaveTextContent("24-25");
    expect(within(rows[0]).getByText("TOR")).toBeInTheDocument();
    expect(within(rows[1]).getByRole("rowheader")).toHaveTextContent("25-26");
    expect(within(rows[1]).getByText("BOS")).toBeInTheDocument();
  });
});
