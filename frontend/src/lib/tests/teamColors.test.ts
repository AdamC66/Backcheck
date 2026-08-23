import { describe, expect, it } from "vitest";
import { paletteFor, readableTextOn } from "../teamColors";

const WHITE = "#FFFFFF";

describe("readableTextOn", () => {
  it("puts light text on a dark team colour", () => {
    expect(readableTextOn("#00205B")).toBe(WHITE);
    expect(readableTextOn("#000000")).toBe(WHITE);
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

  it("keeps a white secondary for the jersey stripe, where it sits on the primary", () => {
    const palette = paletteFor({
      primary_color: "#00205B",
      secondary_color: "#FFFFFF",
      tertiary_color: null,
    });

    expect(palette.secondary).toBe("#FFFFFF");
    expect(palette.accent).toBeNull();
  });
});
