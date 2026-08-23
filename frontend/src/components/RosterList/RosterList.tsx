import { Card } from "@/components/Card/Card";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { initialsFrom } from "@/lib/initials";
import { positionAbbreviation, type RosterGroup } from "@/lib/roster";
import type { RosterEntry } from "@/models/roster";

export interface RosterListProps {
  groups: RosterGroup[];
}

function AssignmentBadge({ entry }: { entry: RosterEntry }) {
  if (entry.assignment === null) return null;

  const { team, contract_level_inferred } = entry.assignment;
  const title = contract_level_inferred
    ? `Assigned to ${team.name} (inferred, not reported directly)`
    : `Assigned to ${team.name}`;

  return (
    <span
      title={title}
      className="inline-flex shrink-0 items-center gap-1 border border-team-primary/20 bg-team-primary/10 px-1.5 py-0.5 text-xs font-bold text-team-primary"
    >
      {team.abbreviation}
    </span>
  );
}

// The primary visual mark for a row, not a headshot — falls back to initials
// rather than leaving the badge blank when no number is on file.
function JerseyBadge({ number, fullName }: { number: number | null; fullName: string }) {
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

function PlayerRow({ entry }: { entry: RosterEntry }) {
  const { player } = entry;
  const fullName = `${player.first_name} ${player.last_name}`;

  return (
    <li className="flex items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-0">
      <JerseyBadge number={entry.jersey_number} fullName={fullName} />

      <Text variant="title" className="min-w-0 flex-1 truncate">
        {fullName}
      </Text>

      <span className="w-7 shrink-0 bg-slate-100 px-1.5 py-0.5 text-center text-xs font-bold text-slate-500">
        {positionAbbreviation(player.position)}
      </span>

      <AssignmentBadge entry={entry} />
    </li>
  );
}

export function RosterList({ groups }: RosterListProps) {
  return (
    <Stack gap="md">
      {groups.map((group) => (
        <Stack key={group.key} gap="xs">
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-1 bg-team-accent" />
            <Text variant="label" className="font-display uppercase tracking-wide">
              {group.label}
            </Text>
          </span>

          <Card padding="none">
            <ul>
              {group.entries.map((entry) => (
                <PlayerRow key={entry.player.id} entry={entry} />
              ))}
            </ul>
          </Card>
        </Stack>
      ))}
    </Stack>
  );
}
