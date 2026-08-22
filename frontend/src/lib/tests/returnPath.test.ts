import { describe, expect, it } from "vitest";
import { returnPathFrom } from "../returnPath";

describe("returnPathFrom", () => {
  it("returns a stashed in-app path", () => {
    expect(returnPathFrom({ from: "/teams/4?season=2026" })).toBe("/teams/4?season=2026");
  });

  it("falls back to the root for anything not an in-app path", () => {
    expect(returnPathFrom(null)).toBe("/");
    expect(returnPathFrom({})).toBe("/");
    expect(returnPathFrom({ from: 42 })).toBe("/");
    expect(returnPathFrom({ from: "https://evil.example.com" })).toBe("/");
    expect(returnPathFrom({ from: "//evil.example.com" })).toBe("/");
  });
});
