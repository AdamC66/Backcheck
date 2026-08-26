import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";
import { playerGameAdvancedStatFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { PlayerAdvancedStatsTable } from "../PlayerAdvancedStatsTable";

describe("PlayerAdvancedStatsTable", () => {
  it("sorts by Corsi-for percentage, highest first, by default", () => {
    const stats = [
      playerGameAdvancedStatFor({
        player: { ...playerGameAdvancedStatFor().player, id: 1, last_name: "Low" },
        corsi_for: 5,
        corsi_against: 15,
      }),
      playerGameAdvancedStatFor({
        player: { ...playerGameAdvancedStatFor().player, id: 2, last_name: "High" },
        corsi_for: 15,
        corsi_against: 5,
      }),
    ];

    renderWithProviders(<PlayerAdvancedStatsTable stats={stats} />);

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByRole("rowheader")).toHaveTextContent("High");
    expect(within(rows[1]).getByRole("rowheader")).toHaveTextContent("Low");
  });

  it("shows an em dash for CF% when a player has no on-ice attempts at all", () => {
    renderWithProviders(
      <PlayerAdvancedStatsTable
        stats={[playerGameAdvancedStatFor({ corsi_for: 0, corsi_against: 0 })]}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
