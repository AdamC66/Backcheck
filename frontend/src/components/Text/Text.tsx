import type { ReactNode } from "react";

const VARIANT_CLASS = {
  heading: "text-2xl font-semibold text-slate-900",
  subheading: "text-lg font-medium text-slate-800",
  body: "text-base text-slate-700",
  label: "text-sm font-medium text-slate-700",
  caption: "text-xs text-slate-500",
} as const;

const VARIANT_ELEMENT = {
  heading: "h1",
  subheading: "h2",
  body: "p",
  label: "span",
  caption: "span",
} as const;

export type TextVariant = keyof typeof VARIANT_CLASS;
export type TextTone = "default" | "danger" | "muted";

const TONE_CLASS = {
  default: "",
  danger: "text-red-600",
  muted: "text-slate-500",
} as const;

export interface TextProps {
  children: ReactNode;
  variant?: TextVariant;
  tone?: TextTone;
  className?: string;
}

export function Text({ children, variant = "body", tone = "default", className }: TextProps) {
  const Element = VARIANT_ELEMENT[variant];
  const classes = [VARIANT_CLASS[variant], TONE_CLASS[tone], className ?? ""]
    .filter(Boolean)
    .join(" ");

  return <Element className={classes}>{children}</Element>;
}
