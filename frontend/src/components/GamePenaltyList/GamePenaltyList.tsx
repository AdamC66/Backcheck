import { Fragment } from "react";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { formatClock, periodLabel } from "@/lib/format";
import { infractionLabel } from "@/lib/penalties";
import type { PenaltyEvent } from "@/models/gameDetail";

export interface GamePenaltyListProps {
  penalties: PenaltyEvent[];
  teamAbbrevById: Record<number, string>;
}

function groupByPeriod(penalties: PenaltyEvent[]): [number, PenaltyEvent[]][] {
  const byPeriod = new Map<number, PenaltyEvent[]>();
  for (const penalty of penalties) {
    const bucket = byPeriod.get(penalty.period) ?? [];
    bucket.push(penalty);
    byPeriod.set(penalty.period, bucket);
  }
  return [...byPeriod.entries()].sort(([a], [b]) => a - b);
}

function offender(penalty: PenaltyEvent): string {
  if (penalty.committed_by !== null) {
    return `${penalty.committed_by.first_name} ${penalty.committed_by.last_name}`;
  }
  return penalty.penalty_type === "bench-minor" ? "Bench" : "—";
}

export function GamePenaltyList({ penalties, teamAbbrevById }: GamePenaltyListProps) {
  if (penalties.length === 0) {
    return <Text tone="muted">No penalties recorded for this game yet.</Text>;
  }

  return (
    <Stack gap="sm">
      {groupByPeriod(penalties).map(([period, periodPenalties]) => (
        <Fragment key={period}>
          <Text variant="caption" className="uppercase">
            {periodLabel(period)}
          </Text>
          <Stack gap="xs">
            {periodPenalties.map((penalty) => (
              <div key={penalty.id} className="flex gap-3 text-sm">
                <span className="w-10 shrink-0 tabular-nums text-slate-500">
                  {formatClock(penalty.period_time_seconds)}
                </span>
                <span className="w-10 shrink-0 font-medium">
                  {teamAbbrevById[penalty.team_id] ?? "—"}
                </span>
                <span className="flex-1">
                  <span className="font-medium text-slate-900">{offender(penalty)}</span>{" "}
                  <span className="text-slate-500">
                    {penalty.penalty_minutes === null ? "" : `${penalty.penalty_minutes} min, `}
                    {infractionLabel(penalty.infraction)}
                  </span>
                </span>
              </div>
            ))}
          </Stack>
        </Fragment>
      ))}
    </Stack>
  );
}
