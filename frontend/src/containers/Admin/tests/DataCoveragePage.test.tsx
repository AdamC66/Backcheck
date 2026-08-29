import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchLeagues } from "@/models/leagues";
import { fetchCoverage } from "@/models/coverage";
import { LEAGUES } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { DataCoveragePage } from "../DataCoveragePage";

vi.mock("@/models/leagues");
vi.mock("@/models/coverage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/models/coverage")>();
  return { ...actual, fetchCoverage: vi.fn() };
});

const cell = (synced: number | null, total: number | null) => ({
  synced,
  total,
  stale: 0,
  syncing: 0,
});

describe("DataCoveragePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fetchLeagues).mockResolvedValue(LEAGUES);
  });

  it("shows synced/total per kind for each season", async () => {
    vi.mocked(fetchCoverage).mockResolvedValue([
      {
        season_id: 7,
        season_label: "2023-24",
        games: cell(1230, 1230),
        roster: cell(32, 32),
        stats: cell(1215, 1230),
        advanced: cell(0, 1230),
      },
    ]);

    renderWithProviders(<DataCoveragePage />);

    expect(await screen.findByText("1215 / 1230")).toBeInTheDocument();
    expect(screen.getByText("0 / 1230")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1215 / 1230" })).toHaveAttribute(
      "href",
      "/admin/data/7/stats",
    );
  });

  it("renders n/a for a kind that does not apply to the league", async () => {
    vi.mocked(fetchCoverage).mockResolvedValue([
      {
        season_id: 9,
        season_label: "2023-24",
        games: cell(null, null),
        roster: cell(20, 30),
        stats: cell(null, null),
        advanced: cell(null, null),
      },
    ]);

    renderWithProviders(<DataCoveragePage />);

    expect(await screen.findByText("20 / 30")).toBeInTheDocument();
    expect(screen.getAllByText("n/a")).toHaveLength(3);
  });
});
