import { OutcomeBadge } from "@/components/OutcomeBadge/OutcomeBadge";
import { Text } from "@/components/Text/Text";
import { formatShortDay, formatTime } from "@/lib/format";
import type { TeamGame } from "@/lib/teamSchedule";

export interface GameRowProps {
  entry: TeamGame;
}

function Result({ entry }: GameRowProps) {
  if (entry.outcome === null) {
    return <Text variant="caption">{formatTime(entry.game.starts_at)}</Text>;
  }

  const extra = ["OT", "SO"].includes(entry.game.last_period_type ?? "")
    ? ` (${entry.game.last_period_type})`
    : "";

  return (
    <span className="flex items-center gap-2">
      <OutcomeBadge outcome={entry.outcome} />
      <span className="font-display tabular-nums text-slate-800">
        {entry.teamScore}–{entry.opponentScore}
        {extra}
      </span>
    </span>
  );
}

export function GameRow({ entry }: GameRowProps) {
  return (
    <li className="flex items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-0">
      <span className="w-16 shrink-0 text-xs font-bold text-slate-400">
        {formatShortDay(entry.game.game_date)}
      </span>

      <span className="w-6 shrink-0 text-xs font-bold text-slate-300">
        {entry.isHome ? "vs" : "@"}
      </span>

      <span className="flex min-w-0 flex-1 items-center gap-2">
        {entry.opponent.logo_url === null ? null : (
          <img src={entry.opponent.logo_url} alt="" className="h-5 w-5 shrink-0 object-contain" />
        )}
        <Text variant="title" className="truncate">
          {entry.opponent.name}
        </Text>
      </span>

      <span className="shrink-0 text-sm">
        <Result entry={entry} />
      </span>
    </li>
  );
}
