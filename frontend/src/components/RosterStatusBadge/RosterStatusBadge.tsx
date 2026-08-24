import type { RosterStatusValue } from "@/models/roster";

export interface RosterStatusBadgeProps {
  status: RosterStatusValue;
}

const STATUS_LABEL: Record<RosterStatusValue, string> = {
  active: "Active",
  injured_reserve: "IR",
  non_roster: "Non-Roster",
};

const STATUS_TONE: Record<RosterStatusValue, string> = {
  active: "",
  injured_reserve: "bg-amber-100 text-amber-800",
  non_roster: "bg-slate-200 text-slate-600",
};

export function RosterStatusBadge({ status }: RosterStatusBadgeProps) {
  if (status === "active") return null;

  return (
    <span className={`shrink-0 px-1.5 py-0.5 text-xs font-bold ${STATUS_TONE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
