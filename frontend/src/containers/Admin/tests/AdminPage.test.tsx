import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router";
import userEvent from "@testing-library/user-event";
import { fetchCurrentUser } from "@/models/auth";
import { fetchSyncRuns } from "@/models/adminSync";
import { fetchRoadmap } from "@/models/roadmap";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { SUPER_ADMIN } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { AdminPage } from "../AdminPage";
import { SyncDashboardPage } from "../SyncDashboardPage";
import { RoadmapPage } from "../RoadmapPage";

vi.mock("@/models/auth");
vi.mock("@/models/adminSync");
vi.mock("@/models/roadmap");

function renderAdmin(route = "/admin") {
  renderWithProviders(
    <Routes>
      <Route path="/admin" element={<AdminPage />}>
        <Route index element={<SyncDashboardPage />} />
        <Route path="roadmap" element={<RoadmapPage />} />
      </Route>
    </Routes>,
    { route },
  );
}

describe("AdminPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    localStorage.setItem(TOKEN_KEY, "test-token");
    vi.mocked(fetchCurrentUser).mockResolvedValue(SUPER_ADMIN);
    vi.mocked(fetchSyncRuns).mockResolvedValue({ data: [], meta: { counts: {} } });
    vi.mocked(fetchRoadmap).mockResolvedValue({ epics: [], tasks: [] });
  });

  it("shows both admin sections in the sidebar, marking the active one", async () => {
    renderAdmin();

    expect(await screen.findByRole("link", { name: "Sync Runs" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Roadmap" })).toBeInTheDocument();
  });

  it("navigates to the roadmap tab", async () => {
    renderAdmin();

    await userEvent.click(await screen.findByRole("link", { name: "Roadmap" }));

    expect(await screen.findByRole("heading", { name: "Roadmap" })).toBeInTheDocument();
  });
});
