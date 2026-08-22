import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCurrentUser } from "@/models/auth";
import { fetchLeagues } from "@/models/leagues";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { LEAGUES, SUPER_ADMIN } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { DashboardPage } from "../DashboardPage";

vi.mock("@/models/auth");
vi.mock("@/models/leagues");

describe("DashboardPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    localStorage.setItem(TOKEN_KEY, "test-token");
    vi.mocked(fetchCurrentUser).mockResolvedValue(SUPER_ADMIN);
  });

  it("lists the leagues the API returns", async () => {
    vi.mocked(fetchLeagues).mockResolvedValue(LEAGUES);

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole("heading", { name: "NHL" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AHL" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ECHL" })).toBeInTheDocument();
  });

  it("says so when the user has access to no leagues", async () => {
    vi.mocked(fetchLeagues).mockResolvedValue([]);

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText(/don't have access to any leagues/)).toBeInTheDocument();
  });
});
