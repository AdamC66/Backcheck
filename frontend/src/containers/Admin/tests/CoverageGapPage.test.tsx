import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router";
import { fetchCoverageGaps } from "@/models/coverage";
import { renderWithProviders, screen } from "@/test-utils";
import { CoverageGapPage } from "../CoverageGapPage";

vi.mock("@/models/coverage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/models/coverage")>();
  return { ...actual, fetchCoverageGaps: vi.fn() };
});

function renderGaps(route: string) {
  renderWithProviders(
    <Routes>
      <Route path="/admin/data/:seasonId/:kind" element={<CoverageGapPage />} />
    </Routes>,
    { route },
  );
}

describe("CoverageGapPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists the missing games behind a stats cell", async () => {
    vi.mocked(fetchCoverageGaps).mockResolvedValue({
      data: [
        {
          game_id: 100,
          game_date: "2023-12-20",
          matchup: "ANA @ COL",
          state: "OFF",
          present: true,
          flagged: false,
          flag: "syncing",
        },
        {
          game_id: 101,
          game_date: "2023-12-23",
          matchup: "SJS @ LAK",
          state: "OFF",
          present: false,
          flagged: false,
          flag: "syncing",
        },
      ],
      meta: { kind: "stats" },
    });

    renderGaps("/admin/data/7/stats");

    expect(await screen.findByText("missing")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "SJS @ LAK" })).toHaveAttribute("href", "/games/101");
  });
});
