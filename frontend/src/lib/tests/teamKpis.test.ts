import { describe, expect, it } from "vitest";
import { TEAMS, standingFor } from "@/test-mocks";
import { pointsTile, recordTile, streakTile } from "../teamKpis";

describe("teamKpis", () => {
  it("formats a record with its division rank", () => {
    const standing = standingFor(TEAMS[0], { division_sequence: 1, division_name: "Central" });

    expect(recordTile(standing)).toEqual({
      label: "Record",
      value: "50-25-7",
      detail: "1st · Central Division",
    });
  });

  it("formats points with the point percentage", () => {
    const standing = standingFor(TEAMS[0], { points: 107, point_pctg: 0.65244 });

    expect(pointsTile(standing).value).toBe("107");
    expect(pointsTile(standing).detail).toBe(".652 point pct");
  });

  it("falls back cleanly when there's no standing yet", () => {
    expect(recordTile(undefined)).toEqual({ label: "Record", value: "—", detail: null });
    expect(streakTile(undefined)).toEqual({ label: "Streak", value: "—", detail: null });
  });

  it("reads a win streak", () => {
    const standing = standingFor(TEAMS[0], { streak_code: "W", streak_count: 3 });

    expect(streakTile(standing)).toEqual({
      label: "Streak",
      value: "W3",
      detail: "Won last 3 games",
    });
  });
});
