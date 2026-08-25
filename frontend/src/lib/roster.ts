import type { Position, RosterEntry } from "@/models/roster";
import type { Team } from "@/models/teams";

export type PositionGroupKey = "forwards" | "defensemen" | "goalies";

const GROUP_FOR_POSITION: Record<Position, PositionGroupKey> = {
  center: "forwards",
  left_wing: "forwards",
  right_wing: "forwards",
  forward: "forwards",
  defense: "defensemen",
  goalie: "goalies",
};

const GROUP_LABEL: Record<PositionGroupKey, string> = {
  forwards: "Forwards",
  defensemen: "Defensemen",
  goalies: "Goalies",
};

const GROUP_ORDER: PositionGroupKey[] = ["forwards", "defensemen", "goalies"];

const POSITION_ABBREVIATION: Record<Position, string> = {
  center: "C",
  left_wing: "LW",
  right_wing: "RW",
  forward: "F",
  defense: "D",
  goalie: "G",
};

export interface RosterGroup {
  key: PositionGroupKey;
  label: string;
  entries: RosterEntry[];
}

// Fixed Forwards → Defensemen → Goalies order, and a group is omitted entirely rather
// than rendered empty — a team mid-backfill can have zero of one position on file.
export function groupRosterByPosition(entries: RosterEntry[]): RosterGroup[] {
  const byGroup = new Map<PositionGroupKey, RosterEntry[]>();

  for (const entry of entries) {
    const key = GROUP_FOR_POSITION[entry.player.position];
    byGroup.set(key, [...(byGroup.get(key) ?? []), entry]);
  }

  return GROUP_ORDER.filter((key) => byGroup.has(key)).map((key) => ({
    key,
    label: GROUP_LABEL[key],
    entries: byGroup.get(key) ?? [],
  }));
}

export function positionAbbreviation(position: Position): string {
  return POSITION_ABBREVIATION[position];
}

export interface AffiliateRosterGroup {
  team: Team;
  entries: RosterEntry[];
}

export interface RosterTabSplit {
  roster: RosterEntry[];
  nonRoster: RosterEntry[];
  byAffiliate: AffiliateRosterGroup[];
}

export const AFFILIATE_TAB_PREFIX = "affiliate:";

export function affiliateTabValue(teamId: number): string {
  return `${AFFILIATE_TAB_PREFIX}${teamId}`;
}

// Non-Roster wins if a player is somehow both non-roster and on loan. A stale
// assignment (an affiliate that's no longer current) falls back to the main roster.
export function splitRosterForTabs(entries: RosterEntry[], affiliateTeams: Team[]): RosterTabSplit {
  const roster: RosterEntry[] = [];
  const nonRoster: RosterEntry[] = [];
  const byAffiliate: AffiliateRosterGroup[] = affiliateTeams.map((team) => ({ team, entries: [] }));

  for (const entry of entries) {
    if (entry.roster_status.status === "non_roster") {
      nonRoster.push(entry);
      continue;
    }

    const group = byAffiliate.find((candidate) => candidate.team.id === entry.assignment?.team.id);
    (group?.entries ?? roster).push(entry);
  }

  return { roster, nonRoster, byAffiliate };
}
