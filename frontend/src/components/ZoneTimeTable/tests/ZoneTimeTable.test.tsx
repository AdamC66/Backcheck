import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";
import { playerFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { ZoneTimeTable } from "../ZoneTimeTable";
import type { ZoneTimeSkater } from "@/models/gameDetail";

function skaterFor(
  overrides: Partial<ZoneTimeSkater> & { player: ZoneTimeSkater["player"] },
): ZoneTimeSkater {
  return {
    team_id: 1,
    starts: { offensive: 0, neutral: 0, defensive: 0, on_the_fly: 0 },
    seconds: { offensive: 0, neutral: 0, defensive: 0 },
    ...overrides,
  };
}

describe("ZoneTimeTable", () => {
  it("sorts by defensive-zone starts and shows zone-time shares", () => {
    renderWithProviders(
      <ZoneTimeTable
        skaters={[
          skaterFor({
            player: playerFor(1, { first_name: "Auston", last_name: "Matthews" }),
            starts: { offensive: 9, neutral: 2, defensive: 3, on_the_fly: 10 },
            seconds: { offensive: 500, neutral: 100, defensive: 400 },
          }),
          skaterFor({
            player: playerFor(2, { first_name: "Morgan", last_name: "Rielly" }),
            starts: { offensive: 3, neutral: 2, defensive: 11, on_the_fly: 10 },
            seconds: { offensive: 200, neutral: 100, defensive: 700 },
          }),
        ]}
      />,
    );

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByRole("rowheader")).toHaveTextContent("Morgan Rielly");
    expect(within(rows[0]).getByText("70%")).toBeInTheDocument();
  });
});
