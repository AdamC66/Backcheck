import type { CSSProperties, ReactNode } from "react";
import { paletteFor } from "@/lib/teamColors";
import type { Team } from "@/models/teams";

export interface TeamThemeProps {
  team: Pick<Team, "primary_color" | "secondary_color" | "tertiary_color"> | undefined;
  children: ReactNode;
  /** Defaults to `contents`, so theming a subtree doesn't introduce a box. */
  className?: string;
}

export function TeamTheme({ team, children, className = "contents" }: TeamThemeProps) {
  const { primary, accent, secondary, trim, onPrimary } = paletteFor(team);

  const variables = {
    ...(primary === null
      ? {}
      : {
          "--color-team-primary": primary,
          "--color-team-contrast": onPrimary,
          "--color-team-secondary": secondary,
          "--color-team-trim": trim,
        }),
    // Without a usable second colour, darkening the primary still reads as a band
    // rather than vanishing into it.
    "--color-team-accent": accent ?? "color-mix(in srgb, var(--color-team-primary) 72%, #000000)",
  } as CSSProperties;

  return (
    <div className={className} style={variables}>
      {children}
    </div>
  );
}
