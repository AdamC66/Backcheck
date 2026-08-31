import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { LineupPlayerPicker } from "@/components/LineupEditor/LineupPlayerPicker";
import {
  DEFENSE_SLOT_LABELS,
  FORWARD_SLOT_LABELS,
  draftFromLineup,
  draftToInput,
  isDraftDirty,
  slotKindFor,
  slotPlayerId,
  slotPositionHint,
  withPlayerAt,
  withScratch,
  withSlotCleared,
  withoutScratch,
  type LineupDraft,
  type SlotTarget,
  type UnitGroup,
} from "@/lib/lineup";
import type { LineupInput, Lineup } from "@/models/lineups";
import type { RosterEntry } from "@/models/roster";

type PickerState = SlotTarget | { scratch: true } | null;

export interface LineupEditorProps {
  initialLineup: Lineup | null;
  roster: RosterEntry[];
  isSaving: boolean;
  onSave: (input: LineupInput) => void;
  templateLineup?: Lineup | null;
  templateLabel?: string;
  onDirtyChange?: (dirty: boolean) => void;
}

export function LineupEditor({
  initialLineup,
  roster,
  isSaving,
  onSave,
  templateLineup,
  templateLabel,
  onDirtyChange,
}: LineupEditorProps) {
  const [original] = useState(() => draftFromLineup(initialLineup));
  const [draft, setDraft] = useState(original);
  const [picker, setPicker] = useState<PickerState>(null);

  const playersById = useMemo(
    () => new Map(roster.map((entry) => [entry.player.id, entry])),
    [roster],
  );
  const dirty = isDraftDirty(draft, original);
  const canSeedFromTemplate =
    initialLineup === null && !dirty && templateLineup != null && templateLabel !== undefined;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);

    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function nameFor(playerId: number | null): string | null {
    if (playerId === null) return null;
    const entry = playersById.get(playerId);

    return entry === undefined
      ? "Unknown player"
      : `${entry.player.first_name} ${entry.player.last_name}`;
  }

  if (roster.length === 0) {
    return (
      <Text tone="muted">
        No roster is on file for this season, so there are no players to dress.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      {canSeedFromTemplate ? (
        <Row justify="between" align="center" gap="sm" className="bg-slate-50 px-3 py-2">
          <Text variant="caption" tone="muted">
            Nothing set for this game yet.
          </Text>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setDraft(draftFromLineup(templateLineup ?? null))}
          >
            Start from {templateLabel}
          </Button>
        </Row>
      ) : null}

      <GridSection
        title="Forward Lines"
        group="forward_lines"
        draft={draft}
        slotLabels={FORWARD_SLOT_LABELS}
        unitPrefix="L"
        nameFor={nameFor}
        onOpen={setPicker}
      />
      <GridSection
        title="Defense Pairs"
        group="defense_pairs"
        draft={draft}
        slotLabels={DEFENSE_SLOT_LABELS}
        unitPrefix="D"
        nameFor={nameFor}
        onOpen={setPicker}
      />
      <GridSection
        title="Power Play"
        group="power_play_units"
        draft={draft}
        unitPrefix="PP"
        nameFor={nameFor}
        onOpen={setPicker}
      />
      <GridSection
        title="Penalty Kill"
        group="penalty_kill_units"
        draft={draft}
        unitPrefix="PK"
        nameFor={nameFor}
        onOpen={setPicker}
      />

      <Section title="Goaltending">
        <SlotButton
          label="Starter"
          slotName="Starting goalie"
          name={nameFor(draft.starting_goalie_id)}
          onClick={() => setPicker({ goalie: "starting" })}
        />
        <SlotButton
          label="Backup"
          slotName="Backup goalie"
          name={nameFor(draft.backup_goalie_id)}
          onClick={() => setPicker({ goalie: "backup" })}
        />
      </Section>

      <Section title="Scratches">
        <div className="flex flex-wrap items-center gap-2 p-3">
          {draft.scratch_ids.map((playerId) => (
            <button
              key={playerId}
              type="button"
              onClick={() => setDraft(withoutScratch(draft, playerId))}
              className="flex items-center gap-1 bg-slate-100 px-2 py-1 hover:bg-slate-200"
            >
              <Text variant="caption">{nameFor(playerId)}</Text>
              <span aria-hidden className="text-slate-400">
                ×
              </span>
            </button>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setPicker({ scratch: true })}
          >
            Add scratch
          </Button>
        </div>
      </Section>

      <Row justify="end" gap="sm">
        <Button
          type="button"
          variant="secondary"
          disabled={!dirty || isSaving}
          onClick={() => setDraft(original)}
        >
          Discard changes
        </Button>
        <Button
          type="button"
          disabled={!dirty || isSaving}
          onClick={() => onSave(draftToInput(draft))}
        >
          {isSaving ? "Saving…" : "Save lineup"}
        </Button>
      </Row>

      {picker === null ? null : "scratch" in picker ? (
        <LineupPlayerPicker
          title="Add scratch"
          roster={roster}
          draft={draft}
          filledPlayerId={null}
          onPick={(playerId) => {
            setDraft(withScratch(draft, playerId));
            setPicker(null);
          }}
          onClear={() => setPicker(null)}
          onClose={() => setPicker(null)}
        />
      ) : (
        <LineupPlayerPicker
          title={pickerTitle(picker)}
          roster={roster}
          draft={draft}
          slotKind={slotKindFor(picker)}
          defaultPosition={slotPositionHint(picker)}
          filledPlayerId={slotPlayerId(draft, picker)}
          onPick={(playerId) => {
            setDraft(withPlayerAt(draft, picker, playerId));
            setPicker(null);
          }}
          onClear={() => {
            setDraft(withSlotCleared(draft, picker));
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </Stack>
  );
}

function pickerTitle(target: SlotTarget): string {
  if ("goalie" in target) {
    return target.goalie === "starting" ? "Starting goalie" : "Backup goalie";
  }

  const prefix = {
    forward_lines: "L",
    defense_pairs: "D",
    power_play_units: "PP",
    penalty_kill_units: "PK",
  };

  return `${prefix[target.group]}${target.unitIndex + 1}`;
}

function GridSection({
  title,
  group,
  draft,
  slotLabels,
  unitPrefix,
  nameFor,
  onOpen,
}: {
  title: string;
  group: UnitGroup;
  draft: LineupDraft;
  slotLabels?: string[];
  unitPrefix: string;
  nameFor: (playerId: number | null) => string | null;
  onOpen: (target: SlotTarget) => void;
}) {
  return (
    <Section title={title}>
      {draft[group].map((unit, unitIndex) => (
        <div
          key={unitIndex}
          className="flex items-stretch border-b border-slate-100 last:border-b-0"
        >
          <div className="flex w-14 shrink-0 items-center justify-center bg-slate-50">
            <Text variant="caption" className="font-jersey text-base text-slate-600">
              {unitPrefix}
              {unitIndex + 1}
            </Text>
          </div>
          <div className="grid flex-1 sm:grid-flow-col sm:auto-cols-fr">
            {unit.map((playerId, slotIndex) => (
              <SlotButton
                key={slotIndex}
                label={slotLabels?.[slotIndex]}
                slotName={`${unitPrefix}${unitIndex + 1} ${slotLabels?.[slotIndex] ?? `slot ${slotIndex + 1}`}`}
                name={nameFor(playerId)}
                onClick={() => onOpen({ group, unitIndex, slotIndex })}
              />
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
}

function SlotButton({
  label,
  slotName,
  name,
  onClick,
}: {
  label?: string;
  slotName: string;
  name: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${slotName} — ${name ?? "add player"}`}
      className="flex flex-col gap-0.5 border-l border-slate-100 px-3 py-2 text-left first:border-l-0 hover:bg-slate-50"
    >
      {label === undefined ? null : (
        <span className="text-[0.65rem] tracking-wide text-slate-400 uppercase">{label}</span>
      )}
      {name === null ? (
        <Text variant="caption" tone="muted">
          + Add
        </Text>
      ) : (
        <Text variant="label" className="font-display">
          {name}
        </Text>
      )}
    </button>
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
