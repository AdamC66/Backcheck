import type { ReactNode } from "react";
import { Card } from "@/components/Card/Card";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import type { Lineup } from "@/models/lineups";
import type { RosterPlayer } from "@/models/roster";

export interface LineupSheetProps {
  lineup: Lineup;
}

const FORWARD_SLOTS = ["LW", "C", "RW"];
const DEFENSE_SLOTS = ["LD", "RD"];

export function LineupSheet({ lineup }: LineupSheetProps) {
  return (
    <Stack gap="md">
      <Section title="Forward Lines">
        {padUnits(lineup.forward_lines, 4).map((line, index) => (
          <UnitRow
            key={`fwd-${index}`}
            label={`L${index + 1}`}
            players={line}
            slotLabels={FORWARD_SLOTS}
          />
        ))}
      </Section>

      <Section title="Defense Pairs">
        {padUnits(lineup.defense_pairs, 3).map((pair, index) => (
          <UnitRow
            key={`def-${index}`}
            label={`D${index + 1}`}
            players={pair}
            slotLabels={DEFENSE_SLOTS}
          />
        ))}
      </Section>

      <Section title="Goaltending">
        <UnitRow label="Starter" players={[lineup.starting_goalie]} />
        <UnitRow label="Backup" players={[lineup.backup_goalie]} />
      </Section>

      {lineup.power_play_units.length > 0 ? (
        <Section title="Power Play">
          {lineup.power_play_units.map((unit, index) => (
            <UnitRow key={`pp-${index}`} label={`PP${index + 1}`} players={unit} />
          ))}
        </Section>
      ) : null}

      {lineup.penalty_kill_units.length > 0 ? (
        <Section title="Penalty Kill">
          {lineup.penalty_kill_units.map((unit, index) => (
            <UnitRow key={`pk-${index}`} label={`PK${index + 1}`} players={unit} />
          ))}
        </Section>
      ) : null}

      {lineup.scratches.length > 0 ? (
        <Section title="Scratches">
          <div className="flex flex-wrap gap-2 p-3">
            {lineup.scratches.map((player) => (
              <span key={player.id} className="bg-slate-100 px-2 py-1">
                <Text variant="caption">{fullName(player)}</Text>
              </span>
            ))}
          </div>
        </Section>
      ) : null}
    </Stack>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap="xs">
      <span className="flex items-center gap-2">
        <span className="h-3.5 w-1 bg-team-accent" />
        <Text variant="label" className="font-display tracking-wide uppercase">
          {title}
        </Text>
      </span>
      <Card padding="none">{children}</Card>
    </Stack>
  );
}

function UnitRow({
  label,
  players,
  slotLabels,
}: {
  label: string;
  players: (RosterPlayer | null)[];
  slotLabels?: string[];
}) {
  return (
    <div className="flex items-stretch border-b border-slate-100 last:border-b-0">
      <div className="flex w-14 shrink-0 items-center justify-center bg-slate-50">
        <Text variant="caption" className="font-jersey text-base text-slate-600">
          {label}
        </Text>
      </div>
      <div className="grid flex-1 sm:grid-flow-col sm:auto-cols-fr">
        {players.map((player, index) => (
          <PlayerCell key={index} player={player} slot={slotLabels?.[index]} />
        ))}
      </div>
    </div>
  );
}

function PlayerCell({ player, slot }: { player: RosterPlayer | null; slot?: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-l border-slate-100 px-3 py-2 first:border-l-0">
      {slot === undefined ? null : (
        <Text variant="caption" className="text-[0.65rem] tracking-wide text-slate-400 uppercase">
          {slot}
        </Text>
      )}
      {player === null ? (
        <Text variant="caption" tone="muted">
          —
        </Text>
      ) : (
        <Text variant="label" className="font-display">
          {fullName(player)}
        </Text>
      )}
    </div>
  );
}

function fullName(player: RosterPlayer): string {
  return `${player.first_name} ${player.last_name}`;
}

// A team may dress fewer than the standard number of units; pad so the sheet always
// shows the full L1–L4 / D1–D3 skeleton rather than collapsing missing rows.
function padUnits(units: RosterPlayer[][], count: number): (RosterPlayer | null)[][] {
  return Array.from({ length: count }, (_, index) => units[index] ?? []);
}
