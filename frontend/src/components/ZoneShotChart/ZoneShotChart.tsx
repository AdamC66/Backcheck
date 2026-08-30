import { Rink } from "@/components/Rink/Rink";
import type { DangerZoneGeometry } from "@/models/dangerZones";
import {
  boardsPath,
  highDangerCreasePath,
  highDangerPolygonPoints,
  midRangeCircle,
  svgX,
  svgY,
  zoneAreas,
} from "@/lib/rink";

export interface ZoneCounts {
  highDanger: number;
  midRange: number;
  longRange: number;
}

export interface ZoneShotChartProps {
  geometry: DangerZoneGeometry;
  counts: ZoneCounts;
  unlocatedCount?: number;
  caption?: string;
}

const RAMP_LIGHT = [238, 244, 253];
const RAMP_DARK = [27, 79, 149];

function rampColor(ratio: number): string {
  const channel = (i: number) => Math.round(RAMP_LIGHT[i] + (RAMP_DARK[i] - RAMP_LIGHT[i]) * ratio);

  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

interface ZoneMark {
  key: keyof ZoneCounts;
  label: string;
  x: number;
  y: number;
}

const MARKS: ZoneMark[] = [
  { key: "longRange", label: "Long range", x: 33, y: -33 },
  { key: "midRange", label: "Mid-range", x: 50, y: 31 },
  { key: "highDanger", label: "High danger", x: 69, y: 0 },
];

export function ZoneShotChart({ geometry, counts, unlocatedCount, caption }: ZoneShotChartProps) {
  const areas = zoneAreas(geometry);
  const density = {
    highDanger: counts.highDanger / areas.highDanger,
    midRange: counts.midRange / areas.midRange,
    longRange: counts.longRange / areas.longRange,
  };
  const maxDensity = Math.max(density.highDanger, density.midRange, density.longRange) || 1;
  const ratio = (key: keyof ZoneCounts) => density[key] / maxDensity;

  const circle = midRangeCircle(geometry);

  return (
    <figure className="flex flex-col gap-2">
      <Rink ariaLabel="Shots by danger zone" markings={false}>
        <path d={boardsPath()} fill={rampColor(ratio("longRange"))} />
        <circle cx={circle.cx} cy={circle.cy} r={circle.r} fill={rampColor(ratio("midRange"))} />
        <polygon points={highDangerPolygonPoints(geometry)} fill={rampColor(ratio("highDanger"))} />
        <path d={highDangerCreasePath(geometry)} fill={rampColor(ratio("highDanger"))} />

        <g fill="none" stroke="white" strokeOpacity={0.7} strokeWidth={1.5}>
          <circle cx={circle.cx} cy={circle.cy} r={circle.r} />
          <polygon points={highDangerPolygonPoints(geometry)} />
          <path d={highDangerCreasePath(geometry)} />
        </g>

        {MARKS.map((mark) => (
          <text
            key={mark.key}
            x={svgX(mark.x)}
            y={svgY(mark.y)}
            textAnchor="middle"
            fontSize={15}
            fill={ratio(mark.key) > 0.55 ? "white" : "#1e293b"}
          >
            <tspan fontWeight={600}>{mark.label}</tspan>
            <tspan x={svgX(mark.x)} dy={18} fontSize={19} fontWeight={700}>
              {counts[mark.key].toLocaleString()}
            </tspan>
          </text>
        ))}
      </Rink>

      <figcaption className="flex items-center justify-between text-xs text-slate-500">
        <span>{caption ?? "Shots by danger zone"}</span>
        {unlocatedCount ? <span>{unlocatedCount.toLocaleString()} without coordinates</span> : null}
      </figcaption>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Lower rate</span>
        <span
          className="h-2 flex-1 rounded"
          style={{ background: `linear-gradient(to right, ${rampColor(0)}, ${rampColor(1)})` }}
        />
        <span>Higher rate</span>
      </div>
    </figure>
  );
}
