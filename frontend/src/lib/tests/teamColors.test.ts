import { describe, expect, it } from "vitest";
import { paletteFor, readableTextOn } from "../teamColors";

const WHITE = "#FFFFFF";
const SLATE = "#0F172A";

describe("readableTextOn", () => {
  it("puts light text on a dark team colour", () => {
    expect(readableTextOn("#00205B")).toBe(WHITE);
    expect(readableTextOn("#000000")).toBe(WHITE);
  });

  it("puts dark text on a light team colour", () => {
    expect(readableTextOn("#FFD457")).toBe(SLATE);
    expect(readableTextOn("#FFFFFF")).toBe(SLATE);
  });

  it("falls back to dark text for a missing or malformed colour", () => {
    expect(readableTextOn(null)).toBe(SLATE);
    expect(readableTextOn("blue")).toBe(SLATE);
  });
});

describe("paletteFor", () => {
  it("uses the secondary colour as the accent", () => {
    const palette = paletteFor({
      primary_color: "#00205B",
      secondary_color: "#B9975B",
      tertiary_color: null,
    });

    expect(palette).toEqual({
      primary: "#00205B",
      accent: "#B9975B",
      secondary: "#B9975B",
      trim: "#B9975B",
      onPrimary: WHITE,
    });
  });

  it("trims the stripe with a distinct third colour", () => {
    // New Jersey: red body, black stripe, white trim.
    const palette = paletteFor({
      primary_color: "#CE1126",
      secondary_color: "#000000",
      tertiary_color: "#FFFFFF",
    });

    expect(palette.secondary).toBe("#000000");
    expect(palette.trim).toBe("#FFFFFF");
  });

  it("repeats the secondary as trim for a two-colour team, so the band stays solid", () => {
    const palette = paletteFor({
      primary_color: "#00205B",
      secondary_color: "#FFFFFF",
      tertiary_color: null,
    });

    expect(palette.trim).toBe(palette.secondary);
  });

  it("skips a trim that wouldn't separate from the stripe it borders", () => {
    const palette = paletteFor({
      primary_color: "#00205B",
      secondary_color: "#FFFFFF",
      tertiary_color: "#F6F6F6",
    });

    expect(palette.secondary).toBe("#FFFFFF");
    expect(palette.trim).toBe("#FFFFFF");
  });

  it("keeps a trim that does separate, even from a light stripe", () => {
    // Calgary: white on gold is 1.88:1, which reads fine.
    const palette = paletteFor({
      primary_color: "#D2001C",
      secondary_color: "#FAAF19",
      tertiary_color: "#FFFFFF",
    });

    expect(palette.trim).toBe("#FFFFFF");
  });

  it("keeps a white secondary for the jersey stripe, where it sits on the primary", () => {
    const palette = paletteFor({
      primary_color: "#00205B",
      secondary_color: "#FFFFFF",
      tertiary_color: null,
    });

    expect(palette.secondary).toBe("#FFFFFF");
    expect(palette.accent).toBeNull();
  });

  it("falls through a secondary that would vanish against the primary itself", () => {
    // Anaheim's gold on its orange is 1.01:1 — invisible as a stripe.
    const palette = paletteFor({
      primary_color: "#F47A38",
      secondary_color: "#B9975B",
      tertiary_color: "#C1C6C8",
    });

    expect(palette.secondary).toBe("#C1C6C8");
  });

  it("falls back to the text colour when no candidate separates from the primary", () => {
    const palette = paletteFor({
      primary_color: "#00205B",
      secondary_color: null,
      tertiary_color: null,
    });

    expect(palette.secondary).toBe(WHITE);
  });

  it("skips a near-white secondary and takes the tertiary instead", () => {
    const palette = paletteFor({
      primary_color: "#00205B",
      secondary_color: "#FFFFFF",
      tertiary_color: "#C8102E",
    });

    expect(palette.accent).toBe("#C8102E");
  });

  it("has no accent when every candidate would vanish", () => {
    const palette = paletteFor({
      primary_color: "#00205B",
      secondary_color: "#FFFFFF",
      tertiary_color: null,
    });

    expect(palette.accent).toBeNull();
  });

  it("skips a secondary too close to the primary to read as separate", () => {
    const palette = paletteFor({
      primary_color: "#00205B",
      secondary_color: "#00215C",
      tertiary_color: "#D2001C",
    });

    expect(palette.accent).toBe("#D2001C");
  });

  it("survives a team with no colours at all", () => {
    const palette = paletteFor({
      primary_color: null,
      secondary_color: null,
      tertiary_color: null,
    });

    expect(palette).toEqual({
      primary: null,
      accent: null,
      secondary: SLATE,
      trim: SLATE,
      onPrimary: SLATE,
    });
  });
});
