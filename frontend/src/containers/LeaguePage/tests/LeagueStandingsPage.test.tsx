import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router";
import { fetchStandings } from "@/models/standings";
import { ApiError } from "@/lib/apiClient";
import { STANDINGS } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { LeagueStandingsPage } from "../LeagueStandingsPage";

vi.mock("@/models/standings");

function renderStandings(route = "/leagues/nhl/standings") {
  renderWithProviders(
    <Routes>
      <Route path="/leagues/:slug/standings" element={<LeagueStandingsPage />} />
    </Routes>,
    { route },
  );
}

describe("LeagueStandingsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fetchStandings).mockResolvedValue(STANDINGS);
  });

  it("groups by the view named in the URL", async () => {
    renderStandings("/leagues/nhl/standings?view=division");

    expect(await screen.findByRole("button", { name: "Division" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Central")).toBeInTheDocument();
  });

  it("shows an empty state when no standings exist", async () => {
    vi.mocked(fetchStandings).mockRejectedValue(new ApiError("not_found", "not found", 404));

    renderStandings();

    expect(
      await screen.findByText("No standings have been collected for this league yet."),
    ).toBeInTheDocument();
  });
});
