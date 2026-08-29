import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { within } from "@testing-library/react";
import { fetchTableSchema } from "@/models/tableSchema";
import { fetchTableRows } from "@/models/serverTable";
import type { TableSchema } from "@/models/tableSchema";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { ServerDataTable, type CellRenderers } from "../ServerDataTable";

vi.mock("@/models/tableSchema");
vi.mock("@/models/serverTable");

const SCHEMA: TableSchema = {
  columns: [
    {
      key: "player",
      label: "Player",
      title: "Player",
      format: "text",
      sortable: true,
      group: "identity",
    },
    { key: "points", label: "P", title: "Points", format: "int", sortable: true, group: "basic" },
  ],
  filters: [
    {
      key: "game_type",
      type: "segmented" as const,
      label: "Game type",
      default: "regular_season",
      options: [
        { value: "regular_season", label: "Regular season" },
        { value: "playoffs", label: "Playoffs" },
      ],
    },
    {
      key: "team_id",
      type: "select" as const,
      label: "Team",
      options: [{ value: 5, label: "Bruins" }],
    },
  ],
  search: { param: "q", placeholder: "Search players" },
  sort: { default: { key: "points", dir: "desc" as const } },
};

const RENDERERS: CellRenderers = {
  player: (value) => (value as { last_name: string }).last_name,
};

describe("ServerDataTable", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fetchTableSchema).mockResolvedValue(SCHEMA);
    vi.mocked(fetchTableRows).mockResolvedValue({
      data: [{ player: { id: 1, first_name: "A", last_name: "Bergeron" }, points: 55 }],
      meta: { page: 1, per_page: 25, total_count: 1, total_pages: 1 },
    });
  });

  it("gives a default-less filter an 'All' cleared state", async () => {
    renderWithProviders(<ServerDataTable resource="league_skaters" cellRenderers={RENDERERS} />);

    const teamSelect = await screen.findByLabelText("Team");
    expect(within(teamSelect).getByRole("option", { name: "All" })).toBeInTheDocument();
    expect(teamSelect).toHaveValue("");
  });

  it("renders rows from the schema and pushes sort state to the request on a header click", async () => {
    renderWithProviders(<ServerDataTable resource="league_skaters" cellRenderers={RENDERERS} />);

    expect(await screen.findByText("Bergeron")).toBeInTheDocument();

    await userEvent.click(within(screen.getByTitle("Points")).getByRole("button"));

    await waitFor(() => {
      expect(
        vi.mocked(fetchTableRows).mock.calls.some(([, query]) => query.includes("sort=points")),
      ).toBe(true);
    });
  });
});
