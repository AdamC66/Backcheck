import { AssignmentBadge } from "@/components/AssignmentBadge/AssignmentBadge";
import { JerseyBadge } from "@/components/JerseyBadge/JerseyBadge";
import { RosterStatusBadge } from "@/components/RosterStatusBadge/RosterStatusBadge";
import { Text } from "@/components/Text/Text";
import { positionAbbreviation } from "@/lib/roster";
import type { RosterEntry } from "@/models/roster";

export interface PlayerRowProps {
  entry: RosterEntry;
  canManageRoster: boolean;
  onManageStatus: (entry: RosterEntry) => void;
  /** Only offered when there's a destination and the player isn't already on loan elsewhere. */
  canSendDown: boolean;
  onSendDown: (entry: RosterEntry) => void;
  onCallUp: (entry: RosterEntry) => void;
}

export function PlayerRow({
  entry,
  canManageRoster,
  onManageStatus,
  canSendDown,
  onSendDown,
  onCallUp,
}: PlayerRowProps) {
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

      <AssignmentBadge assignment={entry.assignment} />
      <RosterStatusBadge status={entry.roster_status.status} />

      {canSendDown && entry.assignment === null ? (
        <button
          type="button"
          onClick={() => onSendDown(entry)}
          className="shrink-0 cursor-pointer border border-slate-300 px-1.5 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          Send down
        </button>
      ) : null}

      {canManageRoster && entry.assignment !== null ? (
        <button
          type="button"
          onClick={() => onCallUp(entry)}
          className="shrink-0 cursor-pointer border border-slate-300 px-1.5 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          Call up
        </button>
      ) : null}

      {canManageRoster ? (
        <button
          type="button"
          onClick={() => onManageStatus(entry)}
          className="shrink-0 cursor-pointer border border-slate-300 px-1.5 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          Manage
        </button>
      ) : null}
    </li>
  );
}
