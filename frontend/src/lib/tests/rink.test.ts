import { describe, expect, it } from "vitest";
import { DANGER_ZONES } from "@/test-mocks";
import { zoneAreas } from "../rink";

describe("zoneAreas", () => {
  it("returns positive on-ice areas with high-danger the smallest", () => {
    const areas = zoneAreas(DANGER_ZONES);

    expect(areas.highDanger).toBeGreaterThan(0);
    expect(areas.highDanger).toBeLessThan(areas.midRange);
    expect(areas.highDanger).toBeLessThan(areas.longRange);
  });
});
