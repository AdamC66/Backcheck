import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GameZoneShareBar } from "../GameZoneShareBar";

describe("GameZoneShareBar", () => {
  it("renders each team's zone share as rounded percentages of its total time", () => {
    render(
      <GameZoneShareBar
        rows={[
          { label: "MTL", offensiveSeconds: 300, neutralSeconds: 400, defensiveSeconds: 500 },
          { label: "TOR", offensiveSeconds: 500, neutralSeconds: 400, defensiveSeconds: 300 },
        ]}
      />,
    );

    expect(screen.getByText("MTL")).toBeInTheDocument();
    expect(screen.getByText("TOR")).toBeInTheDocument();
    // 500 / 1200 for each team's larger zone.
    expect(screen.getAllByText("42%").length).toBe(2);
  });
});
