import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router";
import { fetchCurrentUser } from "@/models/auth";
import { fetchLeague } from "@/models/leagues";
import { ApiError } from "@/lib/apiClient";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { LEAGUE_WITH_TEAMS, SUPER_ADMIN } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { LeaguePage } from "../LeaguePage";

vi.mock("@/models/auth");
vi.mock("@/models/leagues");

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
  });

  it("lists the league's teams", async () => {
    vi.mocked(fetchLeague).mockResolvedValue(LEAGUE_WITH_TEAMS);

    renderAtSlug("nhl");

    expect(await screen.findByText("Anaheim Ducks")).toBeInTheDocument();
    expect(screen.getByText("Boston Bruins")).toBeInTheDocument();
    expect(fetchLeague).toHaveBeenCalledWith("nhl");
  });

  it("surfaces a league the user can't see", async () => {
    vi.mocked(fetchLeague).mockRejectedValue(new ApiError("not_found", "League not found", 404));

    renderAtSlug("nhl");

    expect(await screen.findByText("Could not load this league.")).toBeInTheDocument();
  });
});
