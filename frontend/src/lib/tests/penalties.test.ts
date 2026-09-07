import { describe, expect, it } from "vitest";
import { infractionLabel } from "../penalties";

describe("infractionLabel", () => {
  it("maps slugs whose plain form would read wrong", () => {
    expect(infractionLabel("delaying-game-puck-over-glass")).toBe(
      "Delay of game (puck over glass)",
    );
    expect(infractionLabel("interference-on-goalkeeper")).toBe("Goalie interference");
    expect(infractionLabel("cross-checking")).toBe("Cross-checking");
    expect(infractionLabel("too-many-men-on-the-ice")).toBe("Too many men on the ice");
  });

  it("sentence-cases an unlisted slug", () => {
    expect(infractionLabel("tripping")).toBe("Tripping");
    expect(infractionLabel("hooking")).toBe("Hooking");
  });

  it("unwraps a double minor and a penalty-shot infraction", () => {
    expect(infractionLabel("high-sticking-double-minor")).toBe("High-sticking (double minor)");
    expect(infractionLabel("ps-holding-on-breakaway")).toBe("Holding on breakaway");
  });

  it("falls back to a generic label when the slug is missing", () => {
    expect(infractionLabel(null)).toBe("Penalty");
    expect(infractionLabel("")).toBe("Penalty");
  });
});
