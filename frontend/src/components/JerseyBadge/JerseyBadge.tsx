import { initialsFrom } from "@/lib/initials";

export interface JerseyBadgeProps {
  number: number | null;
  fullName: string;
}

// The primary visual mark for a row, not a headshot — falls back to initials
// rather than leaving the badge blank when no number is on file.
export function JerseyBadge({ number, fullName }: JerseyBadgeProps) {
  if (number === null) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-slate-100">
        <span className="font-display text-sm font-semibold text-slate-400">
          {initialsFrom(fullName)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-team-primary">
      <span className="font-jersey text-xl text-team-contrast">{number}</span>
    </div>
  );
}
