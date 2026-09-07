import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { formatMonthDay, formatTime, formatWeekday } from "@/lib/format";
import { openingDate, type GameDay } from "@/lib/gameDays";
import type { Game, GameSide, GameType } from "@/models/games";

export interface GameTickerProps {
  days: GameDay[];
  isLoading?: boolean;
  hasEarlier?: boolean;
  hasLater?: boolean;
  onReachStart?: () => void;
  onReachEnd?: () => void;
}

const FINISHED = ["FINAL", "OFF"];
const EXTRA_TIME = ["OT", "SO"];
const EDGE_THRESHOLD = 240;
const SCROLL_STEP = 480;

const TYPE_LABEL: Partial<Record<GameType, string>> = {
  preseason: "Preseason",
  playoffs: "Playoffs",
};

function statusOf(game: Game) {
  if (!FINISHED.includes(game.state)) {
    return formatTime(game.starts_at);
  }

  return EXTRA_TIME.includes(game.last_period_type ?? "")
    ? `Final / ${game.last_period_type}`
    : "Final";
}

function Side({ side, won }: { side: GameSide; won: boolean }) {
  const tone = won ? "font-semibold text-slate-900" : "text-slate-600";

  return (
    <span className="flex items-center gap-2">
      {side.team.logo_url === null ? (
        <span className="h-4 w-4 shrink-0" />
      ) : (
        <img src={side.team.logo_url} alt="" className="h-4 w-4 shrink-0 object-contain" />
      )}
      <Link to={`/teams/${side.team.id}`} className={`flex-1 truncate hover:underline ${tone}`}>
        {side.team.abbreviation}
      </Link>
      <span className={`tabular-nums ${tone}`}>{side.score ?? "–"}</span>
    </span>
  );
}

function DateChip({ date }: { date: string }) {
  return (
    <div className="flex w-20 shrink-0 flex-col items-center justify-center bg-slate-800 text-white">
      <span className="text-xs font-semibold tracking-wide uppercase">{formatWeekday(date)}</span>
      <span className="text-xs text-slate-300">{formatMonthDay(date)}</span>
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  const decided = FINISHED.includes(game.state);
  const homeWon = (game.home.score ?? 0) > (game.away.score ?? 0);
  const type = game.game_type === null ? undefined : TYPE_LABEL[game.game_type];

  return (
    <div className="flex w-44 shrink-0 flex-col justify-center border-r border-slate-100 px-3">
      <span className="flex items-baseline justify-between text-[11px] text-slate-500">
        <span className="truncate">{type ?? ""}</span>
        {decided ? (
          <Link
            to={`/games/${game.id}`}
            aria-label={`Box score: ${game.away.team.abbreviation} ${game.away.score ?? 0}, ${game.home.team.abbreviation} ${game.home.score ?? 0}`}
            className="shrink-0 font-medium text-slate-600 hover:text-slate-900 hover:underline"
          >
            {statusOf(game)} ›
          </Link>
        ) : (
          <span className="shrink-0">{statusOf(game)}</span>
        )}
      </span>

      <span className="mt-0.5 flex flex-col gap-0.5 text-sm">
        <Side side={game.away} won={decided && !homeWon} />
        <Side side={game.home} won={decided && homeWon} />
      </span>
    </div>
  );
}

function SkeletonDay() {
  return (
    <>
      <div className="w-20 shrink-0 animate-pulse bg-slate-200" />
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className="flex w-44 shrink-0 animate-pulse flex-col justify-center gap-1.5 border-r border-slate-100 px-3"
        >
          <span className="h-2 w-10 bg-slate-100" />
          <span className="h-3 w-24 bg-slate-100" />
          <span className="h-3 w-20 bg-slate-100" />
        </div>
      ))}
    </>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="w-9 shrink-0 cursor-pointer bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-slate-100"
    >
      {children}
    </button>
  );
}

export function GameTicker({
  days,
  isLoading = false,
  hasEarlier = false,
  hasLater = false,
  onReachStart,
  onReachEnd,
}: GameTickerProps) {
  const strip = useRef<HTMLDivElement>(null);
  const anchor = useRef<{ firstDate: string; fromRight: number } | null>(null);
  const aligned = useRef(false);
  const [fillerWidth, setFillerWidth] = useState(0);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  // Filler has to render before the scroll, or the browser clamps against the old width.
  useLayoutEffect(() => {
    const element = strip.current;
    const date = openingDate(days);
    if (element === null || aligned.current || date === undefined) return;

    const day = element.querySelector<HTMLElement>(`[data-date="${date}"]`);
    if (day === null) return;

    const offset =
      day.getBoundingClientRect().left - element.getBoundingClientRect().left + element.scrollLeft;
    // Cards alone: scrollWidth counts the filler, and measuring it back in oscillates.
    const contentWidth = element.scrollWidth - fillerWidth;
    const needed = Math.max(0, offset + element.clientWidth - contentWidth);

    if (needed !== fillerWidth) {
      setFillerWidth(needed);
      return;
    }

    element.scrollLeft = offset;
    aligned.current = true;
    readEdges();
  }, [days, fillerWidth]);

  // Prepended games would shove the visible cards right; hold the distance from the end.
  useLayoutEffect(() => {
    const element = strip.current;
    const held = anchor.current;
    if (element === null || held === null || days[0]?.date === held.firstDate) return;

    element.scrollLeft = element.scrollWidth - held.fromRight;
    anchor.current = null;
  }, [days]);

  // Reports position only — fetching here would fire repeatedly during a smooth scroll.
  function readEdges() {
    const element = strip.current;
    if (element === null) return;

    const next = {
      atStart: element.scrollLeft <= EDGE_THRESHOLD,
      atEnd: element.scrollWidth - element.scrollLeft - element.clientWidth <= EDGE_THRESHOLD,
    };

    // A fresh object every call would re-render forever from the layout effect.
    setEdges((current) =>
      current.atStart === next.atStart && current.atEnd === next.atEnd ? current : next,
    );
  }

  function step(direction: -1 | 1) {
    const element = strip.current;
    if (element === null) return;

    if (direction < 0 && edges.atStart) {
      anchor.current =
        days[0] === undefined
          ? null
          : { firstDate: days[0].date, fromRight: element.scrollWidth - element.scrollLeft };

      onReachStart?.();
      return;
    }

    if (direction > 0 && edges.atEnd) {
      onReachEnd?.();
      return;
    }

    // Optional call: jsdom, and some older engines, don't implement it on elements.
    element.scrollBy?.({ left: direction * SCROLL_STEP, behavior: "smooth" });
  }

  return (
    <div className="overflow-hidden border border-slate-200 bg-white">
      <div className="flex items-stretch">
        <StepButton
          label="Scroll to earlier games"
          disabled={edges.atStart && !hasEarlier}
          onClick={() => step(-1)}
        >
          ‹
        </StepButton>

        <div ref={strip} onScroll={readEdges} className="no-scrollbar flex-1 overflow-x-auto">
          <div className="flex h-[4.5rem] items-stretch">
            {isLoading ? <SkeletonDay /> : null}

            {!isLoading && days.length === 0 ? (
              <span className="flex flex-1 items-center px-4 text-sm text-slate-500">
                No games to show.
              </span>
            ) : null}

            {days.map((day) => (
              <div key={day.date} data-date={day.date} className="flex items-stretch">
                <DateChip date={day.date} />
                {day.games.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            ))}

            {fillerWidth === 0 ? null : (
              <div data-filler="" style={{ width: fillerWidth }} className="shrink-0" />
            )}
          </div>
        </div>

        <StepButton
          label="Scroll to later games"
          disabled={edges.atEnd && !hasLater}
          onClick={() => step(1)}
        >
          ›
        </StepButton>
      </div>
    </div>
  );
}
