import { useMemo, useState } from "react";
import { Button } from "@/components/Button/Button";
import { Dialog } from "@/components/Dialog/Dialog";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { TextInput } from "@/components/TextInput/TextInput";
import { placementLabel, type LineupDraft } from "@/lib/lineup";
import type { RosterEntry } from "@/models/roster";

export interface LineupPlayerPickerProps {
  title: string;
  roster: RosterEntry[];
  draft: LineupDraft;
  filledPlayerId: number | null;
  onPick: (playerId: number) => void;
  onClear: () => void;
  onClose: () => void;
}

export function LineupPlayerPicker({
  title,
  roster,
  draft,
  filledPlayerId,
  onPick,
  onClear,
  onClose,
}: LineupPlayerPickerProps) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const entries =
      needle === "" ? roster : roster.filter((entry) => fullName(entry).includes(needle));

    return [...entries].sort((a, b) => a.player.last_name.localeCompare(b.player.last_name));
  }, [roster, query]);

  return (
    <Dialog open onClose={onClose} title={title}>
      <Stack gap="sm">
        <TextInput
          id="lineup-player-search"
          label="Search players"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name…"
        />

        <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto border border-slate-200">
          {matches.length === 0 ? (
            <li className="px-3 py-2">
              <Text variant="caption" tone="muted">
                No players match.
              </Text>
            </li>
          ) : (
            matches.map((entry) => {
              const placement = placementLabel(draft, entry.player.id);
              const isThisSlot = entry.player.id === filledPlayerId;

              return (
                <li key={entry.player.id}>
                  <button
                    type="button"
                    onClick={() => onPick(entry.player.id)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-jersey w-6 text-right text-sm text-slate-400">
                        {entry.jersey_number ?? "—"}
                      </span>
                      <Text variant="label" className="font-display">
                        {entry.player.first_name} {entry.player.last_name}
                      </Text>
                    </span>
                    {placement === null ? null : (
                      <Text
                        variant="caption"
                        className={isThisSlot ? "text-slate-400" : "font-bold text-amber-700"}
                      >
                        {placement}
                      </Text>
                    )}
                  </button>
                </li>
              );
            })
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

function fullName(entry: RosterEntry): string {
  return `${entry.player.first_name} ${entry.player.last_name}`.toLowerCase();
}
