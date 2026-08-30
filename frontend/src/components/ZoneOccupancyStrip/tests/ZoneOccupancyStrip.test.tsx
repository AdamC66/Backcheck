import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ZoneOccupancyStrip } from "../ZoneOccupancyStrip";

describe("ZoneOccupancyStrip", () => {
  it("renders a labelled row per period and the home-frame legend", () => {
    render(
      <ZoneOccupancyStrip
        homeAbbreviation="TOR"
        periods={[
          {
            period: 1,
            length_seconds: 1200,
            segments: [
              { start_seconds: 0, end_seconds: 600, zone: "neutral" },
              { start_seconds: 600, end_seconds: 1200, zone: "offensive" },
            ],
          },
          { period: 2, length_seconds: 1200, segments: [] },
        ]}
      />,
    );

    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("P2")).toBeInTheDocument();
    expect(screen.getByText("TOR attacking")).toBeInTheDocument();
    expect(screen.getByText("TOR defending")).toBeInTheDocument();
  });
});
