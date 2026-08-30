import { ZONE_COLOR } from "@/lib/zoneColors";
import type { Zone, ZoneTimePeriod } from "@/models/gameDetail";

export interface ZoneOccupancyStripProps {
  periods: ZoneTimePeriod[];
  homeAbbreviation: string;
}

const ZONE_LABEL: Record<Zone, string> = {
  offensive: "attacking",
  neutral: "neutral",
  defensive: "defending",
};

const GUTTER = 30;
const PLOT_W = 660;
const ROW_H = 24;
const ROW_GAP = 8;
const AXIS_H = 16;
const TICK_SECONDS = 300;

export function ZoneOccupancyStrip({ periods, homeAbbreviation }: ZoneOccupancyStripProps) {
  const maxLength = Math.max(...periods.map((p) => p.length_seconds), 1);
  const x = (seconds: number) => GUTTER + (seconds / maxLength) * PLOT_W;
  const width = GUTTER + PLOT_W + 4;
  const height = periods.length * (ROW_H + ROW_GAP) + AXIS_H;

  const ticks: number[] = [];
  for (let t = 0; t <= maxLength; t += TICK_SECONDS) {
    ticks.push(t);
  }

  return (
    <figure className="m-0 max-w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        className="h-auto max-w-full"
        role="img"
        aria-label={`Zone occupancy over the game, ${homeAbbreviation}'s perspective`}
      >
        {periods.map((period, index) => {
          const y = index * (ROW_H + ROW_GAP);
          return (
            <g key={period.period}>
              <text
                x={GUTTER - 8}
                y={y + ROW_H / 2}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={11}
                fill="#64748b"
              >
                P{period.period}
              </text>
              {period.segments.map((segment) => (
                <rect
                  key={segment.start_seconds}
                  x={x(segment.start_seconds)}
                  y={y}
                  width={Math.max(0, x(segment.end_seconds) - x(segment.start_seconds) - 1)}
                  height={ROW_H}
                  fill={ZONE_COLOR[segment.zone]}
                />
              ))}
            </g>
          );
        })}

        {ticks.map((t) => (
          <text key={t} x={x(t)} y={height - 3} textAnchor="middle" fontSize={10} fill="#94a3b8">
            {Math.round(t / 60)}′
          </text>
        ))}
      </svg>

      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {(["offensive", "neutral", "defensive"] as const).map((zone) => (
          <span key={zone} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5"
              style={{ backgroundColor: ZONE_COLOR[zone] }}
              aria-hidden
            />
            {homeAbbreviation} {ZONE_LABEL[zone]}
          </span>
        ))}
        <span>
          · forward-filled from the last shot/faceoff/hit/turnover, so transitions are approximate
        </span>
      </figcaption>
    </figure>
  );
}
