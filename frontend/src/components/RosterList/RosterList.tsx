import { Avatar } from "@/components/Avatar/Avatar";
import { Card } from "@/components/Card/Card";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
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
      className="inline-flex shrink-0 items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600"
    >
      {team.abbreviation}
    </span>
  );
}

function PlayerRow({ entry }: { entry: RosterEntry }) {
  const { player } = entry;
  const fullName = `${player.first_name} ${player.last_name}`;

  return (
    <li className="flex items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-0">
      {player.headshot_url === null ? (
        <Avatar name={fullName} size="sm" />
      ) : (
        <img
          src={player.headshot_url}
          alt=""
          className="h-8 w-8 shrink-0 rounded-full bg-slate-100 object-cover"
        />
      )}

      <span className="w-6 shrink-0 text-sm tabular-nums text-slate-400">
        {entry.jersey_number ?? "—"}
      </span>

      <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{fullName}</span>

      <span className="w-7 shrink-0 text-xs text-slate-400">
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
            <span className="h-4 w-1 rounded-full bg-team-accent" />
            <Text variant="label">{group.label}</Text>
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
