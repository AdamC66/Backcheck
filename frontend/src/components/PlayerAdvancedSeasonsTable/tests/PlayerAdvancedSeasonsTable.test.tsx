import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";
import { playerAdvancedSeasonFor, seasonFor, teamFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { PlayerAdvancedSeasonsTable } from "../PlayerAdvancedSeasonsTable";

describe("PlayerAdvancedSeasonsTable", () => {
  it("shows one row per season, with the team played for and a derived Corsi For %", () => {
    const seasons = [
      playerAdvancedSeasonFor({
        season: seasonFor(1, "24-25"),
        team: teamFor(1, "TOR"),
        corsi_for: 60,
        corsi_against: 40,
      }),
    ];

    renderWithProviders(<PlayerAdvancedSeasonsTable seasons={seasons} />);

    const row = screen.getAllByRole("row")[1];
    expect(within(row).getByRole("rowheader")).toHaveTextContent("24-25");
    expect(within(row).getByText("TOR")).toBeInTheDocument();
    expect(within(row).getByText("60.0%")).toBeInTheDocument();
  });
});
