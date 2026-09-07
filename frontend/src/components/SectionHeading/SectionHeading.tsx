import type { ReactNode } from "react";

export interface SectionHeadingProps {
  children: ReactNode;
  /** A short note shown to the right of the title (a count, a source caveat). */
  aside?: ReactNode;
  as?: "h2" | "h3";
}

// Picks up the team primary from an enclosing TeamTheme; falls back to slate-800
// (the :root default) when there's no team in scope.
export function SectionHeading({ children, aside, as: Tag = "h2" }: SectionHeadingProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-200 pb-1">
      <Tag className="font-display text-sm font-semibold tracking-wide text-team-primary uppercase">
        {children}
      </Tag>
      {aside === undefined ? null : (
        <span className="shrink-0 text-xs font-medium text-slate-400">{aside}</span>
      )}
    </div>
  );
}
