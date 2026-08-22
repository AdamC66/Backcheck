import type { ReactNode } from "react";

const VARIANT_CLASS = {
  bordered: "border border-slate-200",
  elevated: "shadow-sm",
} as const;

const PADDING_CLASS = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
} as const;

export type CardVariant = keyof typeof VARIANT_CLASS;
export type CardPadding = keyof typeof PADDING_CLASS;

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
}

// Always a plain div: the one caller that needed a <form> surface wraps its form
// instead, which keeps this from growing a polymorphic `as` prop and losing element typing.
export function Card({ children, variant = "bordered", padding = "md", className }: CardProps) {
  const classes = [
    "rounded-lg bg-white",
    VARIANT_CLASS[variant],
    PADDING_CLASS[padding],
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
