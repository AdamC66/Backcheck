import { Card } from "@/components/Card/Card";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import type { GameMonth, GameOutcome, TeamGame } from "@/lib/teamSchedule";

export interface ScheduleListProps {
  months: GameMonth[];
}

const OUTCOME_LABEL: Record<GameOutcome, string> = {
  win: "W",
  loss: "L",
  ot_loss: "OTL",
};

const OUTCOME_TONE: Record<GameOutcome, string> = {
  win: "bg-emerald-100 text-emerald-800",
  loss: "bg-red-100 text-red-800",
  ot_loss: "bg-amber-100 text-amber-800",
};

function dayOf(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
  });
}

function startTime(startsAt: string) {
  return new Date(startsAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function Result({ entry }: { entry: TeamGame }) {
  if (entry.outcome === null) {
    return <Text variant="caption">{startTime(entry.game.starts_at)}</Text>;
  }

  const extra = ["OT", "SO"].includes(entry.game.last_period_type ?? "")
    ? ` (${entry.game.last_period_type})`
    : "";

  return (
    <span className="flex items-center gap-2">
      <span
        className={`rounded px-1.5 py-0.5 text-xs font-semibold ${OUTCOME_TONE[entry.outcome]}`}
      >
        {OUTCOME_LABEL[entry.outcome]}
      </span>
      <span className="tabular-nums text-slate-700">
        {entry.teamScore}–{entry.opponentScore}
        {extra}
      </span>
    </span>
  );
}

export function ScheduleList({ months }: ScheduleListProps) {
  return (
    <Stack gap="md">
      {months.map((month) => (
        <Stack key={month.key} gap="xs">
          <span className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-team-accent" />
            <Text variant="label">{month.label}</Text>
          </span>

          <Card padding="none">
            <ul>
              {month.games.map((entry) => (
                <li
                  key={entry.game.id}
                  className="flex items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-0"
                >
                  <span className="w-16 shrink-0 text-sm text-slate-500">
                    {dayOf(entry.game.game_date)}
                  </span>

                  <span className="w-6 shrink-0 text-xs text-slate-400">
                    {entry.isHome ? "vs" : "@"}
                  </span>

                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    {entry.opponent.logo_url === null ? null : (
                      <img
                        src={entry.opponent.logo_url}
                        alt=""
                        className="h-5 w-5 shrink-0 object-contain"
                      />
                    )}
                    <span className="truncate text-sm text-slate-800">{entry.opponent.name}</span>
                  </span>

                  <span className="shrink-0 text-sm">
                    <Result entry={entry} />
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </Stack>
      ))}
    </Stack>
  );
}
