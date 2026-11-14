import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TEAM_SHOT_LOCATIONS } from "@/test-mocks";
import { ShotDensityMap } from "../ShotDensityMap";

describe("ShotDensityMap", () => {
  it("renders the rink, a shot count and the unlocated count", () => {
    const shots = TEAM_SHOT_LOCATIONS.data.for;

    render(<ShotDensityMap shots={shots} caption="Offense · 5v5" unlocatedCount={12} />);

    expect(screen.getByRole("img", { name: "Offense · 5v5" })).toBeInTheDocument();
    expect(screen.getByText(`${shots.length.toLocaleString()} shots`)).toBeInTheDocument();
    expect(screen.getByText("12 without coordinates")).toBeInTheDocument();
  });

  it("renders nothing chart-breaking for an empty split", () => {
    render(<ShotDensityMap shots={[]} caption="Offense · Power play" />);

    expect(screen.getByRole("img", { name: "Offense · Power play" })).toBeInTheDocument();
    expect(screen.queryByText(/shots/)).not.toBeInTheDocument();
  });
});
