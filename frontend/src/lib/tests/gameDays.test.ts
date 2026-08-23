import { describe, expect, it } from "vitest";
import { gameFor } from "@/test-mocks";
import { groupByDate, openingDate } from "../gameDays";

describe("groupByDate", () => {
  it("collects consecutive games under their date", () => {
    const days = groupByDate([
      gameFor({ id: 1, game_date: "2026-01-05" }),
      gameFor({ id: 2, game_date: "2026-01-05" }),
      gameFor({ id: 3, game_date: "2026-01-06" }),
    ]);

    expect(days.map((day) => [day.date, day.games.length])).toEqual([
      ["2026-01-05", 2],
      ["2026-01-06", 1],
    ]);
  });
});

describe("openingDate", () => {
  const days = groupByDate([
    gameFor({ id: 1, game_date: "2026-01-05" }),
    gameFor({ id: 2, game_date: "2026-01-06" }),
    gameFor({ id: 3, game_date: "2026-01-08" }),
  ]);

  it("opens on today when the season is under way", () => {
    expect(openingDate(days, "2026-01-06")).toBe("2026-01-06");
  });

  it("opens on the most recent date once the season is over", () => {
    expect(openingDate(days, "2026-08-22")).toBe("2026-01-08");
  });
});
