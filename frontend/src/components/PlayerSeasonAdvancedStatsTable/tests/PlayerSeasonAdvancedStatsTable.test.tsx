import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";
import { playerSeasonAdvancedStatFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { PlayerSeasonAdvancedStatsTable } from "../PlayerSeasonAdvancedStatsTable";

describe("PlayerSeasonAdvancedStatsTable", () => {
  it("sorts by Corsi-for percentage, highest first, by default", () => {
    const stats = [
      playerSeasonAdvancedStatFor({
        player: { ...playerSeasonAdvancedStatFor().player, id: 1, last_name: "Low" },
        corsi_for: 50,
        corsi_against: 150,
      }),
      playerSeasonAdvancedStatFor({
        player: { ...playerSeasonAdvancedStatFor().player, id: 2, last_name: "High" },
        corsi_for: 150,
        corsi_against: 50,
      }),
    ];

    renderWithProviders(<PlayerSeasonAdvancedStatsTable stats={stats} />);

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByRole("rowheader")).toHaveTextContent("High");
    expect(within(rows[1]).getByRole("rowheader")).toHaveTextContent("Low");
  });
});
