import type { ReactNode } from "react";
import {
  ALIGN_CLASS,
  GAP_CLASS,
  JUSTIFY_CLASS,
  type Align,
  type Gap,
  type Justify,
} from "@/lib/layout";

export interface StackProps {
  children: ReactNode;
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  className?: string;
}

export function Stack({ children, gap = "md", align, justify, className }: StackProps) {
  const classes = [
    "flex flex-col",
    GAP_CLASS[gap],
    align === undefined ? "" : ALIGN_CLASS[align],
    justify === undefined ? "" : JUSTIFY_CLASS[justify],
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
