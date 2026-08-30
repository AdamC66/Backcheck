import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { DANGER_ZONES } from "@/test-mocks";
import { highDangerPolygonPoints } from "@/lib/rink";
import { DangerZonesOverlay } from "../DangerZonesOverlay";

describe("DangerZonesOverlay", () => {
  it("draws the high-danger polygon from the geometry and labels each zone", () => {
    const { container, getByText } = render(
      <svg>
        <DangerZonesOverlay geometry={DANGER_ZONES} />
      </svg>,
    );

    const polygon = container.querySelector("polygon");
    expect(polygon).toHaveAttribute("points", highDangerPolygonPoints(DANGER_ZONES));
    expect(getByText("High danger")).toBeInTheDocument();
    expect(getByText("Long range")).toBeInTheDocument();
  });

  it("omits labels when showLabels is false", () => {
    const { queryByText } = render(
      <svg>
        <DangerZonesOverlay geometry={DANGER_ZONES} showLabels={false} />
      </svg>,
    );

    expect(queryByText("High danger")).not.toBeInTheDocument();
  });
});
