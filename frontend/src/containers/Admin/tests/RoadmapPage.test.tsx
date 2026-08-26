import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRoadmap } from "@/models/roadmap";
import { renderWithProviders, screen } from "@/test-utils";
import { RoadmapPage } from "../RoadmapPage";

vi.mock("@/models/roadmap");

describe("RoadmapPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("groups tasks under their epic and shows completion progress", async () => {
    vi.mocked(fetchRoadmap).mockResolvedValue({
      epics: [
        { id: "EPIC-1", project_id: "backcheck", title: "Auth foundation", status: "in_progress" },
        { id: "EPIC-2", project_id: "backcheck", title: "Domain model", status: "done" },
      ],
      tasks: [
        { id: "TASK-1", epic_id: "EPIC-1", title: "Add login", status: "done", priority: "high" },
        {
          id: "TASK-2",
          epic_id: "EPIC-1",
          title: "Add logout",
          status: "todo",
          priority: "medium",
        },
      ],
    });

    renderWithProviders(<RoadmapPage />);

    expect(await screen.findByText("EPIC-1 — Auth foundation")).toBeInTheDocument();
    expect(screen.getByText("Add login")).toBeInTheDocument();
    expect(screen.getByText("Add logout")).toBeInTheDocument();
    expect(screen.getByText("1/2 tasks done")).toBeInTheDocument();
    expect(screen.getByText("EPIC-2 — Domain model")).toBeInTheDocument();
  });

  it("shows an error state when the roadmap fails to load", async () => {
    vi.mocked(fetchRoadmap).mockRejectedValue(new Error("boom"));

    renderWithProviders(<RoadmapPage />);

    expect(await screen.findByText("Could not load the roadmap.")).toBeInTheDocument();
  });
});
