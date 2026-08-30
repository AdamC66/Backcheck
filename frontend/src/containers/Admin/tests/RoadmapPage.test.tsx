import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRoadmap } from "@/models/roadmap";
import { renderWithProviders, screen } from "@/test-utils";
import { RoadmapPage } from "../RoadmapPage";

vi.mock("@/models/roadmap");

const ROADMAP = {
  epics: [
    {
      id: "EPIC-1",
      project_id: "backcheck",
      title: "Auth foundation",
      status: "in_progress" as const,
    },
    { id: "EPIC-2", project_id: "backcheck", title: "Domain model", status: "done" as const },
  ],
  tasks: [
    {
      id: "TASK-1",
      epic_id: "EPIC-1",
      title: "Add login",
      status: "done" as const,
      priority: "high" as const,
    },
    {
      id: "TASK-2",
      epic_id: "EPIC-1",
      title: "Add logout",
      status: "todo" as const,
      priority: "medium" as const,
    },
    {
      id: "TASK-3",
      epic_id: "EPIC-2",
      title: "Model teams",
      status: "done" as const,
      priority: "medium" as const,
    },
  ],
};

describe("RoadmapPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("defaults to open work: hides completed tasks and fully-done epics, keeps progress counts", async () => {
    vi.mocked(fetchRoadmap).mockResolvedValue(ROADMAP);

    renderWithProviders(<RoadmapPage />);

    expect(await screen.findByText("EPIC-1 — Auth foundation")).toBeInTheDocument();
    expect(screen.getByText("Add logout")).toBeInTheDocument();
    expect(screen.queryByText("Add login")).not.toBeInTheDocument();
    expect(screen.getByText("1/2 tasks done · 1 completed hidden")).toBeInTheDocument();
    expect(screen.queryByText("EPIC-2 — Domain model")).not.toBeInTheDocument();
  });

  it("switching to Everything reveals completed work", async () => {
    vi.mocked(fetchRoadmap).mockResolvedValue(ROADMAP);

    const user = userEvent.setup();
    renderWithProviders(<RoadmapPage />);
    await screen.findByText("EPIC-1 — Auth foundation");

    await user.click(screen.getByRole("button", { name: "Everything" }));

    expect(screen.getByText("Add login")).toBeInTheDocument();
    expect(screen.getByText("EPIC-2 — Domain model")).toBeInTheDocument();
    expect(screen.getByText("Model teams")).toBeInTheDocument();
  });

  it("shows an error state when the roadmap fails to load", async () => {
    vi.mocked(fetchRoadmap).mockRejectedValue(new Error("boom"));

    renderWithProviders(<RoadmapPage />);

    expect(await screen.findByText("Could not load the roadmap.")).toBeInTheDocument();
  });
});
