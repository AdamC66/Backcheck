import { Stack } from "@/components/Stack/Stack";
import { formatSavePctg } from "@/lib/format";
import type { GoalieGameStat } from "@/models/gameDetail";

export interface GameGoalieDecisionLineProps {
  goalies: GoalieGameStat[];
}

const DECISION_LABELS: Record<string, string> = { W: "W", L: "L", O: "OTL" };

function orderKey(goalie: GoalieGameStat): number {
  if (goalie.decision !== null) return 0;
  return goalie.starter ? 1 : 2;
}

export function GameGoalieDecisionLine({ goalies }: GameGoalieDecisionLineProps) {
  if (goalies.length === 0) {
    return null;
  }

  const ordered = [...goalies].sort((a, b) => orderKey(a) - orderKey(b));

  return (
    <Stack gap="xs">
      {ordered.map((goalie) => (
        <div key={goalie.player.id} className="flex gap-2 text-sm">
          <span className="w-8 shrink-0 font-semibold text-slate-900">
            {goalie.decision === null ? "" : (DECISION_LABELS[goalie.decision] ?? goalie.decision)}
          </span>
          <span className="font-medium text-slate-900">
            {goalie.player.first_name[0]}. {goalie.player.last_name}
          </span>
          <span className="text-slate-500">
            {goalie.saves}/{goalie.shots_against} saves · {formatSavePctg(goalie.save_pctg)}
          </span>
        </div>
      ))}
    </Stack>
  );
}
