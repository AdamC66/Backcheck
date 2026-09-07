import { useRef, useState, type MouseEvent } from "react";
import { RinkFull } from "@/components/Rink/RinkFull";
import { fullSvgX, svgLength, svgY } from "@/lib/rink";
import type { GameShot } from "@/models/gameShots";

export interface ShotScatterProps {
  shots: GameShot[];
  homeLabel: string;
  awayLabel: string;
  homeColor?: string | null;
  awayColor?: string | null;
  unlocatedCount?: number;
}

const FALLBACK_COLOR: Record<GameShot["team_side"], string> = {
  home: "#2a78d6",
  away: "#e0812b",
};

// Circle area tracks xG: r ∝ √xg, floored so a near-zero chance is still visible and
// capped so a grade-A chance doesn't swamp the net.
function radiusFeet(xg: number): number {
  return Math.max(1.3, Math.min(7, Math.sqrt(xg) * 9));
}

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function label(shot: GameShot): string {
  const who = shot.shooter_name ?? "Unknown";
  const type = shot.shot_type ?? "shot";
  const goal = shot.is_goal ? " — GOAL" : "";
  return `${who}, ${type}${goal} · ${shot.distance} ft · xG ${shot.xg.toFixed(2)} · P${shot.period} ${clock(shot.period_time_seconds)}`;
}

interface Hover {
  shot: GameShot;
  left: number;
  top: number;
}

export function ShotScatter({
  shots,
  homeLabel,
  awayLabel,
  homeColor,
  awayColor,
  unlocatedCount,
}: ShotScatterProps) {
  const figureRef = useRef<HTMLElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  const sideColor: Record<GameShot["team_side"], string> = {
    home: homeColor || FALLBACK_COLOR.home,
    away: awayColor || FALLBACK_COLOR.away,
  };

  function track(shot: GameShot, event: MouseEvent) {
    const rect = figureRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ shot, left: event.clientX - rect.left, top: event.clientY - rect.top });
  }

  return (
    <figure ref={figureRef} className="relative flex flex-col gap-2">
      <RinkFull ariaLabel="Shot locations" className="w-full">
        {shots.map((shot, i) => (
          <circle
            key={i}
            cx={fullSvgX(shot.x)}
            cy={svgY(shot.y)}
            r={svgLength(radiusFeet(shot.xg))}
            fill={sideColor[shot.team_side]}
            fillOpacity={shot.is_goal ? 0.95 : 0.32}
            stroke={shot.is_goal ? "white" : "none"}
            strokeWidth={shot.is_goal ? 1.5 : 0}
            role="img"
            aria-label={label(shot)}
            onMouseEnter={(event) => track(shot, event)}
            onMouseMove={(event) => track(shot, event)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </RinkFull>

      {hover && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded bg-slate-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg"
          style={{ left: hover.left, top: hover.top - 8 }}
        >
          {label(hover.shot)}
        </div>
      )}

      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: sideColor.home }}
          />
          {homeLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: sideColor.away }}
          />
          {awayLabel}
        </span>
        <span>Filled ring = goal · circle size = shot quality (xG)</span>
        {unlocatedCount ? <span>{unlocatedCount} without coordinates</span> : null}
      </figcaption>
    </figure>
  );
}
