import { Link } from "react-router";
import { Text } from "@/components/Text/Text";
import { formatGameDateTime, formatTime } from "@/lib/format";
import type { Game, GameSide } from "@/models/games";

export interface GameHeaderProps {
  game: Game;
  statsSyncing: boolean;
}

const FINISHED = ["FINAL", "OFF"];
const EXTRA_TIME = ["OT", "SO"];

function statusLabel(game: Game): string {
  if (!FINISHED.includes(game.state)) {
    return formatTime(game.starts_at);
  }
  return EXTRA_TIME.includes(game.last_period_type ?? "")
    ? `Final / ${game.last_period_type}`
    : "Final";
}

function TeamBlock({ side, align }: { side: GameSide; align: "start" | "end" }) {
  const alignment =
    align === "start" ? "sm:items-start sm:text-left" : "sm:items-end sm:text-right";

  return (
    <Link
      to={`/teams/${side.team.id}`}
      className={`flex flex-1 flex-col items-center gap-1 hover:underline ${alignment}`}
    >
      {side.team.logo_url === null ? null : (
        <img src={side.team.logo_url} alt="" className="h-12 w-12 object-contain" />
      )}
      <span className="font-display text-lg leading-tight font-semibold text-slate-900">
        {side.team.name}
      </span>
      <Text variant="caption">{side.team.abbreviation}</Text>
    </Link>
  );
}

function Score({ value, won }: { value: number | null; won: boolean }) {
  return (
    <span
      className={`font-display text-4xl tabular-nums ${won ? "font-bold text-slate-900" : "font-semibold text-slate-500"}`}
    >
      {value ?? "–"}
    </span>
  );
}

export function GameHeader({ game, statsSyncing }: GameHeaderProps) {
  const decided = FINISHED.includes(game.state);
  const homeWon = (game.home.score ?? 0) > (game.away.score ?? 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <TeamBlock side={game.away} align="end" />

        <div className="flex shrink-0 flex-col items-center gap-1">
          <span className="flex items-center gap-3">
            <Score value={game.away.score} won={decided && !homeWon} />
            <span className="text-slate-300">–</span>
            <Score value={game.home.score} won={decided && homeWon} />
          </span>
          <Text variant="caption" className="font-bold tracking-wide text-slate-500 uppercase">
            {statusLabel(game)}
          </Text>
        </div>

        <TeamBlock side={game.home} align="start" />
      </div>

      <Text tone="muted" variant="caption" className="text-center">
        {formatGameDateTime(game.starts_at)}
        {game.venue === null ? "" : ` · ${game.venue}`}
      </Text>

      {statsSyncing ? (
        <Text tone="muted" variant="caption" className="text-center">
          Advanced stats are recalculating for this game — numbers may change shortly.
        </Text>
      ) : null}
    </div>
  );
}
