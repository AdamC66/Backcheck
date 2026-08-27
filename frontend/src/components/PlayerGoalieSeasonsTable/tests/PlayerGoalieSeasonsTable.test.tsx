import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";
import { playerGoalieSeasonFor, seasonFor, teamFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { PlayerGoalieSeasonsTable } from "../PlayerGoalieSeasonsTable";

describe("PlayerGoalieSeasonsTable", () => {
  it("shows one row per season, with the team played for and a formatted save percentage", () => {
    const seasons = [
      playerGoalieSeasonFor({
        season: seasonFor(1, "24-25"),
        team: teamFor(1, "TOR"),
        save_pctg: 0.921,
      }),
    ];

    renderWithProviders(<PlayerGoalieSeasonsTable seasons={seasons} />);

    const row = screen.getAllByRole("row")[1];
    expect(within(row).getByRole("rowheader")).toHaveTextContent("24-25");
    expect(within(row).getByText("TOR")).toBeInTheDocument();
    expect(within(row).getByText(".921")).toBeInTheDocument();
  });
});
