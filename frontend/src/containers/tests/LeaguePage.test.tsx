import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router";
import { fetchCurrentUser } from "@/models/auth";
import { fetchLeague } from "@/models/leagues";
import { fetchStandings } from "@/models/standings";
import { ApiError } from "@/lib/apiClient";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { LEAGUE_WITH_TEAMS, STANDINGS, SUPER_ADMIN } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { LeaguePage } from "../LeaguePage";

vi.mock("@/models/auth");
vi.mock("@/models/leagues");
vi.mock("@/models/standings");

function renderAtSlug(slug: string) {
  renderWithProviders(
    <Routes>
      <Route path="/leagues/:slug" element={<LeaguePage />} />
    </Routes>,
    { route: `/leagues/${slug}` },
  );
}

describe("LeaguePage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    localStorage.setItem(TOKEN_KEY, "test-token");
    vi.mocked(fetchCurrentUser).mockResolvedValue(SUPER_ADMIN);
    vi.mocked(fetchLeague).mockResolvedValue(LEAGUE_WITH_TEAMS);
    vi.mocked(fetchStandings).mockResolvedValue(STANDINGS);
  });

  it("lists the league's teams", async () => {
    renderAtSlug("nhl");

    expect(await screen.findByRole("heading", { name: "Teams" })).toBeInTheDocument();
    expect(await screen.findAllByText("Boston Bruins")).not.toHaveLength(0);
    expect(fetchLeague).toHaveBeenCalledWith("nhl");
  });

  it("shows the standings with the season they describe", async () => {
    renderAtSlug("nhl");

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.getByText(/2025-26/)).toBeInTheDocument();
    expect(screen.getByText(/as of Apr 17, 2026/)).toBeInTheDocument();
  });

  it("puts teams ahead of standings in the markup, which is what stacks them above on a phone", async () => {
    renderAtSlug("nhl");
    await screen.findByRole("table");

    const headings = screen.getAllByRole("heading").map((heading) => heading.textContent);

    expect(headings.indexOf("Teams")).toBeLessThan(headings.indexOf("Standings"));
  });

  it("groups by the view named in the URL", async () => {
    renderAtSlug("nhl?view=division");

    expect(await screen.findByRole("button", { name: "Division" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // The fixture's two teams share a division, so grouping puts them under its heading.
    expect(screen.getByText("Central")).toBeInTheDocument();
  });

  it("falls back to the league view when the URL names something unknown", async () => {
    renderAtSlug("nhl?view=nonsense");

    expect(await screen.findByRole("button", { name: "League" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("treats a league with no ingested season as an absence, not an error", async () => {
    vi.mocked(fetchStandings).mockRejectedValue(new ApiError("not_found", "Season not found", 404));

    renderAtSlug("ahl");

    expect(await screen.findByText(/No standings have been collected/)).toBeInTheDocument();
    expect(screen.queryByText("Could not load standings.")).not.toBeInTheDocument();
  });

  it("surfaces a league the user can't see", async () => {
    vi.mocked(fetchLeague).mockRejectedValue(new ApiError("not_found", "League not found", 404));

    renderAtSlug("nhl");

    expect(await screen.findByText("Could not load this league.")).toBeInTheDocument();
  });
});
