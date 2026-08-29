import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { fetchTableSchema, type TableSchema } from "@/models/tableSchema";
import { fetchTableRows } from "@/models/serverTable";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { LeagueStatsPage } from "../LeagueStatsPage";

vi.mock("@/models/tableSchema");
vi.mock("@/models/serverTable");

const schemaFor = (label: string): TableSchema => ({
  columns: [
    {
      key: "player",
      label: "Player",
      title: "Player",
      format: "text",
      sortable: true,
      group: "identity",
    },
    { key: label, label: "X", title: "X", format: "int", sortable: true, group: "basic" },
  ],
  filters: [
    { key: "league", type: "select", label: "League", options: [{ value: "nhl", label: "NHL" }] },
  ],
  search: null,
  sort: { default: { key: label, dir: "desc" } },
});

function renderStats() {
  renderWithProviders(
    <Routes>
      <Route path="/leagues/:slug/stats" element={<LeagueStatsPage />} />
    </Routes>,
    { route: "/leagues/nhl/stats" },
  );
}

describe("LeagueStatsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fetchTableSchema).mockImplementation((resource) =>
      Promise.resolve(schemaFor(resource === "league_goalies" ? "wins" : "points")),
    );
    vi.mocked(fetchTableRows).mockResolvedValue({
      data: [],
      meta: { page: 1, per_page: 25, total_count: 0, total_pages: 0 },
    });
  });

  it("pins the league to the route and hides its filter control", async () => {
    renderStats();

    await waitFor(() =>
      expect(fetchTableRows).toHaveBeenCalledWith(
        "league_skaters",
        expect.stringContaining("league=nhl"),
      ),
    );
    expect(screen.queryByLabelText("League")).not.toBeInTheDocument();
  });

  it("swaps to the goalie resource when the type toggle is switched", async () => {
    renderStats();

    await userEvent.click(screen.getByRole("button", { name: "Goalies" }));

    await waitFor(() =>
      expect(fetchTableRows).toHaveBeenCalledWith("league_goalies", expect.any(String)),
    );
  });
});
