import type { Standing } from "@/models/standings";

export const STANDINGS_VIEWS = ["league", "conference", "division", "wildcard"] as const;

export type StandingsView = (typeof STANDINGS_VIEWS)[number];

export type RankKey =
  "league_sequence" | "conference_sequence" | "division_sequence" | "wildcard_sequence";

export interface StandingsGroup {
  key: string;
  title: string | null;
  standings: Standing[];
  rankKey: RankKey;
  rankPrefix?: string;
  cutlineAfter?: number;
}

export interface StandingsSection {
  key: string;
  title: string | null;
  groups: StandingsGroup[];
}

export function isStandingsView(value: string | null): value is StandingsView {
  return value !== null && STANDINGS_VIEWS.includes(value as StandingsView);
}

function bySequence(key: RankKey) {
  return (a: Standing, b: Standing) => (a[key] ?? Infinity) - (b[key] ?? Infinity);
}

function groupBy(standings: Standing[], key: (standing: Standing) => string | null) {
  return standings.reduce((groups, standing) => {
    const name = key(standing);
    if (name === null) return groups;

    const existing = groups.get(name);

    if (existing === undefined) {
      groups.set(name, [standing]);
    } else {
      existing.push(standing);
    }

    return groups;
  }, new Map<string, Standing[]>());
}

/**
 * Conferences and divisions are only present for seasons the NHL organized that way, and
 * never for a league we haven't ingested standings structure for — so anything but the
 * league view can be genuinely unavailable rather than empty.
 */
export function supportsView(standings: Standing[], view: StandingsView) {
  if (view === "league") return standings.length > 0;
  if (standings.length === 0) return false;

  const grouped = view === "division" ? "division_name" : "conference_name";

  return standings.every((standing) => standing[grouped] !== null);
}

function leagueSections(standings: Standing[]): StandingsSection[] {
  return [
    {
      key: "league",
      title: null,
      groups: [
        {
          key: "league",
          title: null,
          standings: [...standings].sort(bySequence("league_sequence")),
          rankKey: "league_sequence",
        },
      ],
    },
  ];
}

function conferenceSections(standings: Standing[]): StandingsSection[] {
  const ordered = [...standings].sort(bySequence("conference_sequence"));

  return [...groupBy(ordered, (standing) => standing.conference_name)]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, rows]) => ({
      key: name,
      title: name,
      groups: [
        { key: name, title: null, standings: rows, rankKey: "conference_sequence" as const },
      ],
    }));
}

function divisionSections(standings: Standing[]): StandingsSection[] {
  const ordered = [...standings].sort(bySequence("division_sequence"));

  return [...groupBy(ordered, (standing) => standing.division_name)]
    .sort(([, a], [, b]) => a[0].conference_name?.localeCompare(b[0].conference_name ?? "") ?? 0)
    .map(([name, rows]) => ({
      key: name,
      title: name,
      groups: [{ key: name, title: null, standings: rows, rankKey: "division_sequence" as const }],
    }));
}

function wildcardSections(standings: Standing[]): StandingsSection[] {
  return [...groupBy(standings, (standing) => standing.conference_name)]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([conference, rows]) => {
      const holders = rows
        .filter((standing) => standing.wildcard_sequence === 0)
        .sort(bySequence("division_sequence"));
      const chasers = rows
        .filter((standing) => (standing.wildcard_sequence ?? 0) > 0)
        .sort(bySequence("wildcard_sequence"));

      const divisions = [...groupBy(holders, (standing) => standing.division_name)]
        .sort(([, a], [, b]) => (a[0].conference_sequence ?? 0) - (b[0].conference_sequence ?? 0))
        .map(([name, teams]) => ({
          key: `${conference}-${name}`,
          title: name,
          standings: teams,
          rankKey: "division_sequence" as const,
        }));

      return {
        key: conference,
        title: conference,
        groups: [
          ...divisions,
          {
            key: `${conference}-wildcard`,
            title: "Wild Card",
            standings: chasers,
            rankKey: "wildcard_sequence" as const,
            rankPrefix: "WC",
            cutlineAfter: chasers.length > 2 ? 1 : undefined,
          },
        ],
      };
    });
}

export function standingsSections(standings: Standing[], view: StandingsView): StandingsSection[] {
  switch (view) {
    case "conference":
      return conferenceSections(standings);
    case "division":
      return divisionSections(standings);
    case "wildcard":
      return wildcardSections(standings);
    default:
      return leagueSections(standings);
  }
}
