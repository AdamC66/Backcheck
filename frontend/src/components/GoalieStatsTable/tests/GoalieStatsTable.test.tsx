import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";
import { goalieSeasonStatFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { GoalieStatsTable } from "../GoalieStatsTable";

describe("GoalieStatsTable", () => {
  it("sorts by wins, highest first, by default, and formats rate stats without a leading zero", () => {
    const stats = [
      goalieSeasonStatFor({
        player: { ...goalieSeasonStatFor().player, id: 1, first_name: "Joseph", last_name: "Woll" },
        wins: 10,
        save_pctg: 0.905,
      }),
      goalieSeasonStatFor({
        player: {
          ...goalieSeasonStatFor().player,
          id: 2,
          first_name: "Anthony",
          last_name: "Stolarz",
        },
        wins: 20,
        save_pctg: 0.921,
      }),
    ];

    renderWithProviders(<GoalieStatsTable stats={stats} />);

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByRole("rowheader")).toHaveTextContent("Anthony Stolarz");
    expect(within(rows[0]).getByText(".921")).toBeInTheDocument();
  });

  it("shows an em dash for a rate stat that has no shots against yet", () => {
    renderWithProviders(
      <GoalieStatsTable
        stats={[goalieSeasonStatFor({ save_pctg: null, goals_against_average: null })]}
      />,
    );

    expect(screen.getAllByText("—")).toHaveLength(2);
  });
});
