import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";
import { skaterGameStatFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { GameSkaterStatsTable } from "../GameSkaterStatsTable";

describe("GameSkaterStatsTable", () => {
  it("sorts by points, highest first, by default", () => {
    const stats = [
      skaterGameStatFor({
        player: {
          ...skaterGameStatFor().player,
          id: 1,
          first_name: "Auston",
          last_name: "Matthews",
        },
        points: 1,
      }),
      skaterGameStatFor({
        player: {
          ...skaterGameStatFor().player,
          id: 2,
          first_name: "William",
          last_name: "Nylander",
        },
        points: 3,
      }),
    ];

    renderWithProviders(<GameSkaterStatsTable stats={stats} />);

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByRole("rowheader")).toHaveTextContent("William Nylander");
    expect(within(rows[1]).getByRole("rowheader")).toHaveTextContent("Auston Matthews");
  });
});
