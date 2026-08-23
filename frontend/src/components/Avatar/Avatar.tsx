import { initialsFrom } from "@/lib/initials";

const SIZE_CLASS = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
} as const;

export type AvatarSize = keyof typeof SIZE_CLASS;

export interface AvatarProps {
  /** Email or display name — initials are derived from it. */
  name: string;
  size?: AvatarSize;
}

// Presentational only: aria-hidden because whatever wraps this (a button, a list row)
// owns the accessible name, and initials read as gibberish to a screen reader.
export function Avatar({ name, size = "md" }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        "inline-flex shrink-0 items-center justify-center",
        "bg-slate-700 font-medium text-white select-none",
        SIZE_CLASS[size],
      ].join(" ")}
    >
      {initialsFrom(name)}
    </span>
  );
}
