import { ordinal } from "@/lib/format";
import type { Standing } from "@/models/standings";

export interface KpiTile {
  label: string;
  value: string;
  detail: string | null;
}

const EMPTY: KpiTile = { label: "", value: "—", detail: null };

export function recordTile(standing: Standing | undefined): KpiTile {
  if (standing === undefined) return { ...EMPTY, label: "Record" };

  const detail =
    standing.division_name === null || standing.division_sequence === null
      ? null
      : `${ordinal(standing.division_sequence)} · ${standing.division_name} Division`;

  return {
    label: "Record",
    value: `${standing.wins}-${standing.losses}-${standing.ot_losses}`,
    detail,
  };
}

export function pointsTile(standing: Standing | undefined): KpiTile {
  if (standing === undefined) return { ...EMPTY, label: "Points" };

  return {
    label: "Points",
    value: String(standing.points),
    detail:
      standing.point_pctg === null
        ? null
        : `${standing.point_pctg.toFixed(3).replace(/^0/, "")} point pct`,
  };
}

const STREAK_VERB: Record<string, string> = { W: "Won", L: "Lost", OT: "Points in" };

export function streakTile(standing: Standing | undefined): KpiTile {
  if (standing?.streak_code == null || standing.streak_count === null) {
    return { ...EMPTY, label: "Streak" };
  }

  const { streak_code: code, streak_count: count } = standing;

  return {
    label: "Streak",
    value: `${code}${count}`,
    detail: `${STREAK_VERB[code] ?? "Streak of"} last ${count} game${count === 1 ? "" : "s"}`,
  };
}
