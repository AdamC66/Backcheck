import type { ReactNode } from "react";
import {
  ALIGN_CLASS,
  GAP_CLASS,
  JUSTIFY_CLASS,
  type Align,
  type Gap,
  type Justify,
} from "@/lib/layout";

export interface RowProps {
  children: ReactNode;
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  className?: string;
}

export function Row({
  children,
  gap = "md",
  align = "center",
  justify,
  wrap = false,
  className,
}: RowProps) {
  const classes = [
    "flex flex-row",
    GAP_CLASS[gap],
    ALIGN_CLASS[align],
    justify === undefined ? "" : JUSTIFY_CLASS[justify],
    wrap ? "flex-wrap" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
