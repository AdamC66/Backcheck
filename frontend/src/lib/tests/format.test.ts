import { describe, expect, it } from "vitest";
import {
  formatFullDate,
  formatGameDateTime,
  formatMonthDay,
  formatMonthYear,
  formatShortDay,
  formatTime,
  formatWeekday,
  ordinal,
  toIsoDate,
} from "../format";

describe("ordinal", () => {
  it("suffixes 1st/2nd/3rd/4th normally", () => {
    expect(ordinal(1)).toBe("1st");
    expect(ordinal(2)).toBe("2nd");
    expect(ordinal(3)).toBe("3rd");
    expect(ordinal(4)).toBe("4th");
  });

  it("special-cases the 11th–13th teens", () => {
    expect(ordinal(11)).toBe("11th");
    expect(ordinal(12)).toBe("12th");
    expect(ordinal(13)).toBe("13th");
    expect(ordinal(21)).toBe("21st");
  });
});

describe("toIsoDate", () => {
  it("formats a Date as YYYY-MM-DD", () => {
    expect(toIsoDate(new Date("2026-03-18T04:00:00Z"))).toBe("2026-03-18");
  });
});

// A date-only string ("2026-03-18") has no time of day, so these all guard against the
// UTC-midnight-parses-as-yesterday bug rather than just checking one happy path.
describe("date-only formatters", () => {
  it("read the given date, not the day before it", () => {
    expect(formatWeekday("2026-03-18")).toMatch(/Wed/);
    expect(formatShortDay("2026-03-18")).toMatch(/Wed/);
    expect(formatShortDay("2026-03-18")).toMatch(/18/);
    expect(formatMonthDay("2026-03-18")).toMatch(/Mar/);
    expect(formatMonthDay("2026-03-18")).toMatch(/18/);
    expect(formatMonthYear("2026-03-18")).toMatch(/March 2026/);
    expect(formatFullDate("2026-03-18")).toMatch(/Mar/);
    expect(formatFullDate("2026-03-18")).toMatch(/2026/);
  });
});

describe("formatTime", () => {
  it("formats a full timestamp's time of day", () => {
    expect(formatTime("2026-03-18T23:00:00Z")).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe("formatGameDateTime", () => {
  it("combines the day and the time", () => {
    const result = formatGameDateTime("2026-03-18T23:00:00Z");

    expect(result).toMatch(/Wed/);
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/·.*\d{1,2}:\d{2}/);
  });
});
