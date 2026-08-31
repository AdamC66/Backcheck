import type { Lineup, LineupInput } from "@/models/lineups";

export const FORWARD_LINE_COUNT = 4;
export const FORWARD_LINE_SIZE = 3;
export const DEFENSE_PAIR_COUNT = 3;
export const DEFENSE_PAIR_SIZE = 2;
export const POWER_PLAY_UNIT_COUNT = 2;
export const POWER_PLAY_UNIT_SIZE = 5;
export const PENALTY_KILL_UNIT_COUNT = 2;
export const PENALTY_KILL_UNIT_SIZE = 4;

export const FORWARD_SLOT_LABELS = ["LW", "C", "RW"];
export const DEFENSE_SLOT_LABELS = ["LD", "RD"];

export type SkaterGroup = "forward_lines" | "defense_pairs";
export type UnitGroup = SkaterGroup | "power_play_units" | "penalty_kill_units";

export interface LineupDraft {
  forward_lines: (number | null)[][];
  defense_pairs: (number | null)[][];
  power_play_units: (number | null)[][];
  penalty_kill_units: (number | null)[][];
  starting_goalie_id: number | null;
  backup_goalie_id: number | null;
  scratch_ids: number[];
}

const GRID_SHAPE: Record<UnitGroup, { count: number; size: number }> = {
  forward_lines: { count: FORWARD_LINE_COUNT, size: FORWARD_LINE_SIZE },
  defense_pairs: { count: DEFENSE_PAIR_COUNT, size: DEFENSE_PAIR_SIZE },
  power_play_units: { count: POWER_PLAY_UNIT_COUNT, size: POWER_PLAY_UNIT_SIZE },
  penalty_kill_units: { count: PENALTY_KILL_UNIT_COUNT, size: PENALTY_KILL_UNIT_SIZE },
};

export function emptyDraft(): LineupDraft {
  return {
    forward_lines: emptyGrid("forward_lines"),
    defense_pairs: emptyGrid("defense_pairs"),
    power_play_units: emptyGrid("power_play_units"),
    penalty_kill_units: emptyGrid("penalty_kill_units"),
    starting_goalie_id: null,
    backup_goalie_id: null,
    scratch_ids: [],
  };
}

export function draftFromLineup(lineup: Lineup | null): LineupDraft {
  if (lineup === null) return emptyDraft();

  return {
    forward_lines: fillGrid("forward_lines", lineup.forward_lines),
    defense_pairs: fillGrid("defense_pairs", lineup.defense_pairs),
    power_play_units: fillGrid("power_play_units", lineup.power_play_units),
    penalty_kill_units: fillGrid("penalty_kill_units", lineup.penalty_kill_units),
    starting_goalie_id: lineup.starting_goalie?.id ?? null,
    backup_goalie_id: lineup.backup_goalie?.id ?? null,
    scratch_ids: lineup.scratches.map((player) => player.id),
  };
}

export function draftToInput(draft: LineupDraft): LineupInput {
  return {
    forward_lines: compactGrid(draft.forward_lines),
    defense_pairs: compactGrid(draft.defense_pairs),
    power_play_units: compactGrid(draft.power_play_units),
    penalty_kill_units: compactGrid(draft.penalty_kill_units),
    starting_goalie_id: draft.starting_goalie_id,
    backup_goalie_id: draft.backup_goalie_id,
    scratches: draft.scratch_ids,
  };
}

export function isDraftDirty(current: LineupDraft, original: LineupDraft): boolean {
  return JSON.stringify(draftToInput(current)) !== JSON.stringify(draftToInput(original));
}

// Where a player currently sits in the draft, as a short tag ("L1", "PP2", "Scratch"),
// or null if unplaced — drives the "already assigned" hint in the picker.
export function placementLabel(draft: LineupDraft, playerId: number): string | null {
  const grids: [UnitGroup, string][] = [
    ["forward_lines", "L"],
    ["defense_pairs", "D"],
    ["power_play_units", "PP"],
    ["penalty_kill_units", "PK"],
  ];

  for (const [group, prefix] of grids) {
    const unitIndex = draft[group].findIndex((unit) => unit.includes(playerId));
    if (unitIndex !== -1) return `${prefix}${unitIndex + 1}`;
  }

  if (draft.starting_goalie_id === playerId) return "Starter";
  if (draft.backup_goalie_id === playerId) return "Backup";
  if (draft.scratch_ids.includes(playerId)) return "Scratch";

  return null;
}

function emptyGrid(group: UnitGroup): (number | null)[][] {
  const { count, size } = GRID_SHAPE[group];

  return Array.from({ length: count }, () => Array.from({ length: size }, () => null));
}

function fillGrid<T extends { id: number }>(group: UnitGroup, units: T[][]): (number | null)[][] {
  const { count, size } = GRID_SHAPE[group];

  return Array.from({ length: count }, (_, unitIndex) => {
    const unit = units[unitIndex] ?? [];

    return Array.from({ length: size }, (_, slotIndex) => unit[slotIndex]?.id ?? null);
  });
}

function compactGrid(grid: (number | null)[][]): number[][] {
  return grid.map((unit) => unit.filter((id): id is number => id !== null));
}

export type SlotTarget =
  { group: UnitGroup; unitIndex: number; slotIndex: number } | { goalie: "starting" | "backup" };

export function slotPlayerId(draft: LineupDraft, target: SlotTarget): number | null {
  if ("goalie" in target) {
    return target.goalie === "starting" ? draft.starting_goalie_id : draft.backup_goalie_id;
  }

  return draft[target.group][target.unitIndex][target.slotIndex];
}

// A skater fills exactly one even-strength slot, so placing one on a line clears any
// pair he was in (and vice versa); power play, penalty kill, and goalie are each their
// own independent pool, which is what lets a top player sit on L1 and PP1 at once. Any
// placement also pulls the player out of the scratch list.
export function withPlayerAt(
  draft: LineupDraft,
  target: SlotTarget,
  playerId: number,
): LineupDraft {
  const next = removeFromScope(draft, conflictScope(target), playerId);

  if ("goalie" in target) {
    return target.goalie === "starting"
      ? { ...next, starting_goalie_id: playerId }
      : { ...next, backup_goalie_id: playerId };
  }

  return {
    ...next,
    [target.group]: setInGrid(next[target.group], target.unitIndex, target.slotIndex, playerId),
  };
}

export function withSlotCleared(draft: LineupDraft, target: SlotTarget): LineupDraft {
  if ("goalie" in target) {
    return target.goalie === "starting"
      ? { ...draft, starting_goalie_id: null }
      : { ...draft, backup_goalie_id: null };
  }

  return {
    ...draft,
    [target.group]: setInGrid(draft[target.group], target.unitIndex, target.slotIndex, null),
  };
}

export function withScratch(draft: LineupDraft, playerId: number): LineupDraft {
  const cleared = removeFromScope(
    draft,
    {
      groups: ["forward_lines", "defense_pairs", "power_play_units", "penalty_kill_units"],
      goalies: true,
    },
    playerId,
  );

  return { ...cleared, scratch_ids: [...cleared.scratch_ids, playerId] };
}

export function withoutScratch(draft: LineupDraft, playerId: number): LineupDraft {
  return { ...draft, scratch_ids: draft.scratch_ids.filter((id) => id !== playerId) };
}

interface ConflictScope {
  groups: UnitGroup[];
  goalies: boolean;
}

function conflictScope(target: SlotTarget): ConflictScope {
  if ("goalie" in target) return { groups: [], goalies: true };
  if (target.group === "forward_lines" || target.group === "defense_pairs") {
    return { groups: ["forward_lines", "defense_pairs"], goalies: false };
  }

  return { groups: [target.group], goalies: false };
}

function removeFromScope(draft: LineupDraft, scope: ConflictScope, playerId: number): LineupDraft {
  const next: LineupDraft = {
    ...draft,
    scratch_ids: draft.scratch_ids.filter((id) => id !== playerId),
  };

  for (const group of scope.groups) {
    next[group] = next[group].map((unit) => unit.map((id) => (id === playerId ? null : id)));
  }

  if (scope.goalies) {
    if (next.starting_goalie_id === playerId) next.starting_goalie_id = null;
    if (next.backup_goalie_id === playerId) next.backup_goalie_id = null;
  }

  return next;
}

function setInGrid(
  grid: (number | null)[][],
  unitIndex: number,
  slotIndex: number,
  value: number | null,
): (number | null)[][] {
  return grid.map((unit, index) =>
    index === unitIndex ? unit.map((id, position) => (position === slotIndex ? value : id)) : unit,
  );
}
