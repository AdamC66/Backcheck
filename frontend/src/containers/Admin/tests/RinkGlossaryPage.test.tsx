import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchDangerZones } from "@/models/dangerZones";
import { DANGER_ZONES } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { RinkGlossaryPage } from "../RinkGlossaryPage";

vi.mock("@/models/dangerZones");

describe("RinkGlossaryPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders the danger-zone boundaries and the zone chart once the geometry loads", async () => {
    vi.mocked(fetchDangerZones).mockResolvedValue(DANGER_ZONES);

    renderWithProviders(<RinkGlossaryPage />);

    expect(await screen.findByText("The boundaries")).toBeInTheDocument();
    expect(screen.getByText("As a zone chart")).toBeInTheDocument();
    expect(screen.getAllByRole("img").length).toBeGreaterThan(0);
  });

  it("shows an error when the geometry cannot be loaded", async () => {
    vi.mocked(fetchDangerZones).mockRejectedValue(new Error("boom"));

    renderWithProviders(<RinkGlossaryPage />);

    expect(await screen.findByText("Could not load the danger-zone geometry.")).toBeInTheDocument();
  });
});
