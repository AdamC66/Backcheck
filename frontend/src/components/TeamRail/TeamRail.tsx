import { TeamCard } from "@/components/TeamCard/TeamCard";
import type { Team } from "@/models/teams";

export interface TeamRailProps {
  teams: Team[];
}

export function TeamRail({ teams }: TeamRailProps) {
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 lg:mx-0 lg:max-h-[calc(100vh-6rem)] lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:px-0 lg:pb-0">
      {teams.map((team) => (
        <div key={team.id} className="w-56 shrink-0 lg:w-auto lg:shrink">
          <TeamCard team={team} />
        </div>
      ))}
    </div>
  );
}
