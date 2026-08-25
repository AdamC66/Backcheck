import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { skaterSeasonStatFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { SkaterStatsTable } from "../SkaterStatsTable";

describe("SkaterStatsTable", () => {
  const stats = [
    skaterSeasonStatFor({
      player: {
        ...skaterSeasonStatFor().player,
        id: 1,
        first_name: "Auston",
        last_name: "Matthews",
      },
      goals: 40,
      points: 66,
    }),
    skaterSeasonStatFor({
      player: {
        ...skaterSeasonStatFor().player,
        id: 2,
        first_name: "William",
        last_name: "Nylander",
      },
      goals: 30,
      points: 79,
    }),
  ];

  it("sorts by points, highest first, by default", () => {
    renderWithProviders(<SkaterStatsTable stats={stats} />);

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByRole("rowheader")).toHaveTextContent("William Nylander");
    expect(within(rows[1]).getByRole("rowheader")).toHaveTextContent("Auston Matthews");
  });

  it("re-sorts when a column header is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SkaterStatsTable stats={stats} />);
    const goalsHeaderButton = () => within(screen.getByTitle("Goals")).getByRole("button");

    await user.click(goalsHeaderButton());
    let rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByRole("rowheader")).toHaveTextContent("Auston Matthews");

    await user.click(goalsHeaderButton());
    rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByRole("rowheader")).toHaveTextContent("William Nylander");
  });
});
