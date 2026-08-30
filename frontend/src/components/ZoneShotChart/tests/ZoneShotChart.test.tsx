import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DANGER_ZONES } from "@/test-mocks";
import { ZoneShotChart } from "../ZoneShotChart";

describe("ZoneShotChart", () => {
  it("labels each zone with its shot count", () => {
    render(
      <ZoneShotChart
        geometry={DANGER_ZONES}
        counts={{ highDanger: 163, midRange: 166, longRange: 47 }}
      />,
    );

    expect(screen.getByText("163")).toBeInTheDocument();
    expect(screen.getByText("47")).toBeInTheDocument();
  });

  it("shows the unlocated-shot count when given", () => {
    render(
      <ZoneShotChart
        geometry={DANGER_ZONES}
        counts={{ highDanger: 1, midRange: 1, longRange: 1 }}
        unlocatedCount={12}
      />,
    );

    expect(screen.getByText("12 without coordinates")).toBeInTheDocument();
  });
});
