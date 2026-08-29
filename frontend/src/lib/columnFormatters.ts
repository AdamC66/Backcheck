// The `format` vocabulary the backend's table schema uses (one token per column). The
// backend owns which columns exist and their format; the frontend owns how each token
// renders. A null value always shows as an em dash.
export type ColumnFormat =
  "text" | "int" | "decimal1" | "decimal2" | "pct1" | "pct3" | "toi" | "plus_minus";

const DASH = "—";

function toMinutesSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export const FORMATTERS: Record<Exclude<ColumnFormat, "text">, (value: number) => string> = {
  int: (value) => String(Math.round(value)),
  decimal1: (value) => value.toFixed(1),
  decimal2: (value) => value.toFixed(2),
  // A save/shooting percentage reads as .918, not 0.918 or 91.8%.
  pct3: (value) => value.toFixed(3).replace(/^0/, ""),
  pct1: (value) => `${(value * 100).toFixed(1)}%`,
  toi: (value) => toMinutesSeconds(value),
  plus_minus: (value) => (value > 0 ? `+${value}` : String(value)),
};

export function formatCell(value: unknown, format: ColumnFormat): string {
  if (value === null || value === undefined) return DASH;
  if (format === "text") return String(value);
  if (typeof value !== "number" || Number.isNaN(value)) return DASH;

  return FORMATTERS[format](value);
}
