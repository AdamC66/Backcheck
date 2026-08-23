import type { ReactNode } from "react";
import type { Team } from "@/models/teams";

export interface TeamHeaderProps {
  team: Team | undefined;
  subtitle?: ReactNode;
}

export function TeamHeader({ team, subtitle }: TeamHeaderProps) {
  return (
    // pb-4 leaves a band of primary under the stripe, so it reads as a jersey hem
    // rather than a border on the card.
    <div className="overflow-hidden rounded-lg bg-team-primary pb-4 text-team-contrast">
      <div className="flex items-center gap-4 px-5 py-4">
        {team?.logo_url === undefined || team.logo_url === null ? null : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/90 p-1.5">
            <img
              src={team.logo_url}
              alt={`${team.name} logo`}
              className="max-h-full max-w-full object-contain"
            />
          </span>
        )}

        <span className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{team?.name ?? "Team"}</h1>
          {subtitle === undefined ? null : <span className="text-sm opacity-80">{subtitle}</span>}
        </span>
      </div>

      <div className="h-1 bg-team-trim" />
      <div className="h-2.5 bg-team-secondary" />
      <div className="h-1 bg-team-trim" />
    </div>
  );
}
