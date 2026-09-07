import { TeamTheme } from "@/components/TeamTheme/TeamTheme";
import type { Team } from "@/models/teams";

export type GameSideKey = "away" | "home";

export interface TeamSideToggleProps {
  away: Team;
  home: Team;
  value: GameSideKey;
  onChange: (value: GameSideKey) => void;
}

const BASE =
  "cursor-pointer px-3 py-1.5 text-sm font-semibold tracking-wide uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";
const ACTIVE = "bg-team-primary text-team-contrast";
const INACTIVE = "bg-slate-100 text-slate-600 hover:text-slate-900";

function SideButton({
  team,
  sideLabel,
  selected,
  onClick,
}: {
  team: Team;
  sideLabel: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <TeamTheme team={team}>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onClick}
        className={`${BASE} ${selected ? ACTIVE : INACTIVE}`}
      >
        {team.abbreviation} <span className="font-normal">[{sideLabel}]</span>
      </button>
    </TeamTheme>
  );
}

export function TeamSideToggle({ away, home, value, onChange }: TeamSideToggleProps) {
  return (
    <div role="group" aria-label="Team" className="inline-flex gap-1">
      <SideButton
        team={away}
        sideLabel="Away"
        selected={value === "away"}
        onClick={() => onChange("away")}
      />
      <SideButton
        team={home}
        sideLabel="Home"
        selected={value === "home"}
        onClick={() => onChange("home")}
      />
    </div>
  );
}
