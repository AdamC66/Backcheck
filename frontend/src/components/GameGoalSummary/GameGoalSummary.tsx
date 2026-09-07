import { Fragment } from "react";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { formatClock, periodLabel } from "@/lib/format";
import type { EventStrengthState, GoalEvent } from "@/models/gameDetail";

export interface GameGoalSummaryProps {
  goals: GoalEvent[];
  teamAbbrevById: Record<number, string>;
}

const STRENGTH_BADGE: Partial<Record<EventStrengthState, string>> = {
  power_play: "PP",
  short_handed: "SH",
};

function groupByPeriod(goals: GoalEvent[]): [number, GoalEvent[]][] {
  const byPeriod = new Map<number, GoalEvent[]>();
  for (const goal of goals) {
    const bucket = byPeriod.get(goal.period) ?? [];
    bucket.push(goal);
    byPeriod.set(goal.period, bucket);
  }
  return [...byPeriod.entries()].sort(([a], [b]) => a - b);
}

function assistLine(goal: GoalEvent): string {
  if (goal.assists.length === 0) return "unassisted";
  return goal.assists.map((player) => `${player.first_name[0]}. ${player.last_name}`).join(", ");
}

export function GameGoalSummary({ goals, teamAbbrevById }: GameGoalSummaryProps) {
  if (goals.length === 0) {
    return <Text tone="muted">No goals recorded for this game yet.</Text>;
  }

  return (
    <Stack gap="sm">
      {groupByPeriod(goals).map(([period, periodGoals]) => (
        <Fragment key={period}>
          <Text variant="caption" className="uppercase">
            {periodLabel(period)}
          </Text>
          <Stack gap="xs">
            {periodGoals.map((goal) => {
              const badge =
                goal.strength_state === null ? null : STRENGTH_BADGE[goal.strength_state];
              return (
                <div key={goal.id} className="flex gap-3 text-sm">
                  <span className="w-10 shrink-0 tabular-nums text-slate-500">
                    {formatClock(goal.period_time_seconds)}
                  </span>
                  <span className="w-10 shrink-0 font-medium">
                    {teamAbbrevById[goal.team_id] ?? "—"}
                  </span>
                  <span className="flex-1">
                    <span className="font-medium text-slate-900">
                      {goal.scorer.first_name} {goal.scorer.last_name}
                    </span>{" "}
                    <span className="text-slate-500">({assistLine(goal)})</span>
                  </span>
                  {badge === null || badge === undefined ? null : (
                    <span className="shrink-0 text-xs font-semibold text-slate-500">{badge}</span>
                  )}
                </div>
              );
            })}
          </Stack>
        </Fragment>
      ))}
    </Stack>
  );
}
