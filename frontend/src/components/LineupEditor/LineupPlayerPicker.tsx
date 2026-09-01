import { useMemo, useState } from "react";
import { Button } from "@/components/Button/Button";
import { Dialog } from "@/components/Dialog/Dialog";
import { Row } from "@/components/Row/Row";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { TextInput } from "@/components/TextInput/TextInput";
import {
  matchesPositionFilter,
  placementLabel,
  positionAbbrev,
  positionFilterFor,
  type LineupDraft,
  type PositionFilterValue,
  type SlotKind,
} from "@/lib/lineup";
import type { Position, RosterEntry } from "@/models/roster";

export interface LineupPlayerPickerProps {
  title: string;
  roster: RosterEntry[];
  draft: LineupDraft;
  filledPlayerId: number | null;
  slotKind?: SlotKind;
  defaultPosition?: Position;
  onPick: (playerId: number) => void;
  onClear: () => void;
  onClose: () => void;
}

export function LineupPlayerPicker({
  title,
  roster,
  draft,
  filledPlayerId,
  slotKind,
  defaultPosition,
  onPick,
  onClear,
  onClose,
}: LineupPlayerPickerProps) {
  const positionFilter = positionFilterFor(slotKind, defaultPosition);
  const [position, setPosition] = useState<PositionFilterValue>(positionFilter?.initial ?? "all");
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const matches = useMemo(() => {
    return roster
      .filter((entry) => {
        // Injured-reserve / non-roster players can't dress; the backend rejects them too.
        if (entry.roster_status.status !== "active") return false;

        const playerPosition = entry.player.position;
        if (slotKind === "goalie") return playerPosition === "goalie";
        if (slotKind !== undefined && playerPosition === "goalie") return false;
        if (!matchesPositionFilter(playerPosition, position)) return false;

        return needle === "" || fullName(entry).includes(needle);
      })
      .sort((a, b) => a.player.last_name.localeCompare(b.player.last_name));
  }, [roster, slotKind, position, needle]);

  return (
    <Dialog open onClose={onClose} title={title}>
      <Stack gap="sm">
        <TextInput
          id="lineup-player-search"
          label="Search players"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name…"
          autoFocus
        />

        {positionFilter === null ? null : (
          <SegmentedControl
            label="Filter by position"
            options={positionFilter.options}
            value={position}
            onChange={setPosition}
          />
        )}

        <ul className="h-72 min-h-72 shrink-0 divide-y divide-slate-100 overflow-y-auto border border-slate-200">
          {matches.length === 0 ? (
            <li className="px-3 py-2">
              <Text variant="caption" tone="muted">
                No players match.
              </Text>
            </li>
          ) : (
            matches.map((entry) => (
              <PlayerOption
                key={entry.player.id}
                entry={entry}
                draft={draft}
                isThisSlot={entry.player.id === filledPlayerId}
                onPick={onPick}
              />
            ))
          )}
        </ul>

        <Row justify="between" gap="sm">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {filledPlayerId === null ? null : (
            <Button type="button" variant="danger" onClick={onClear}>
              Clear slot
            </Button>
          )}
        </Row>
      </Stack>
    </Dialog>
  );
}

function PlayerOption({
  entry,
  draft,
  isThisSlot,
  onPick,
}: {
  entry: RosterEntry;
  draft: LineupDraft;
  isThisSlot: boolean;
  onPick: (playerId: number) => void;
}) {
  const placement = placementLabel(draft, entry.player.id);

  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(entry.player.id)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="font-jersey w-6 shrink-0 text-right text-sm text-slate-400">
            {entry.jersey_number ?? "—"}
          </span>
          <Text variant="label" className="font-display truncate">
            {entry.player.first_name} {entry.player.last_name}
          </Text>
          <span className="shrink-0 text-[0.65rem] tracking-wide text-slate-400 uppercase">
            {positionAbbrev(entry.player.position)}
          </span>
        </span>
        {placement === null ? null : (
          <Text
            variant="caption"
            className={isThisSlot ? "shrink-0 text-slate-400" : "shrink-0 font-bold text-amber-700"}
          >
            {placement}
          </Text>
        )}
      </button>
    </li>
  );
}

function fullName(entry: RosterEntry): string {
  return `${entry.player.first_name} ${entry.player.last_name}`.toLowerCase();
}
