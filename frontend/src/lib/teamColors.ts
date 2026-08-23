const LIGHT_TEXT = "#FFFFFF";
const DARK_TEXT = "#0F172A";

const HEX = /^#[0-9a-f]{6}$/i;

export interface TeamPalette {
  primary: string | null;
  /** Reads against the page — rejects near-white. */
  accent: string | null;
  /** Reads against the primary, where white is a legitimate jersey stripe. */
  secondary: string;
  /** Trims the stripe above and below; equal to `secondary` when there's no third colour. */
  trim: string;
  onPrimary: string;
}

interface Colored {
  primary_color: string | null;
  secondary_color: string | null;
  tertiary_color: string | null;
}

function channels(hex: string) {
  if (!HEX.test(hex)) return null;

  return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
}

// WCAG relative luminance, so the text choice is a measured contrast rather than a guess
// about which colors "look dark".
function luminance(hex: string) {
  const rgb = channels(hex);
  if (rgb === null) return null;

  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255;

    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number, b: number) {
  const [lighter, darker] = a > b ? [a, b] : [b, a];

  return (lighter + 0.05) / (darker + 0.05);
}

export function readableTextOn(hex: string | null) {
  const background = hex === null ? null : luminance(hex);
  if (background === null) return DARK_TEXT;

  const white = luminance(LIGHT_TEXT) as number;
  const dark = luminance(DARK_TEXT) as number;

  return contrast(background, white) >= contrast(background, dark) ? LIGHT_TEXT : DARK_TEXT;
}

// A secondary that's near-white or nearly the primary disappears against them — several
// NHL teams list #FFFFFF second — so fall through to the next usable color.
function usableAccent(candidate: string | null, primary: string | null) {
  const value = candidate === null ? null : luminance(candidate);
  if (value === null) return false;
  if (value > 0.75) return false;

  const base = primary === null ? null : luminance(primary);

  return base === null || contrast(value, base) >= 1.3;
}

// Distinguishable from the primary, but white is fine — five teams wear a white hem
// stripe, and it only disappears when the surface behind it is the page rather than
// the primary.
function separableFrom(candidate: string | null, primary: string | null) {
  const value = candidate === null ? null : luminance(candidate);
  if (value === null) return false;

  const base = primary === null ? null : luminance(primary);

  return base === null || contrast(value, base) >= 1.3;
}

export function paletteFor(team: Colored | undefined): TeamPalette {
  const primary = team?.primary_color ?? null;
  const candidates = [team?.secondary_color ?? null, team?.tertiary_color ?? null];
  const onPrimary = readableTextOn(primary);
  const secondary = candidates.find((candidate) => separableFrom(candidate, primary)) ?? onPrimary;

  // Falls back to the secondary rather than nothing, so a two-colour team renders one
  // solid band instead of a stripe with gaps where the trim would be.
  const trim =
    candidates.find(
      (candidate) =>
        candidate !== secondary &&
        separableFrom(candidate, secondary) &&
        separableFrom(candidate, primary),
    ) ?? secondary;

  return {
    primary: primary !== null && HEX.test(primary) ? primary : null,
    accent: candidates.find((candidate) => usableAccent(candidate, primary)) ?? null,
    secondary,
    trim,
    onPrimary,
  };
}
