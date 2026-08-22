// Tailwind scans source for literal class names, so the scale has to be spelled out
// rather than built by interpolation. Shared by Row and Stack to keep one gap scale.
export const GAP_CLASS = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
} as const;

export type Gap = keyof typeof GAP_CLASS;

export const ALIGN_CLASS = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
} as const;

export type Align = keyof typeof ALIGN_CLASS;

export const JUSTIFY_CLASS = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
} as const;

export type Justify = keyof typeof JUSTIFY_CLASS;
