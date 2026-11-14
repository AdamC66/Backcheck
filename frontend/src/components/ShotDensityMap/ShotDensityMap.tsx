import { useMemo } from "react";
import { Rink } from "@/components/Rink/Rink";
import { svgLength, svgX, svgY } from "@/lib/rink";
import { densityBands } from "@/lib/shotDensity";
import type { TeamShotLocation } from "@/models/teamShotLocations";

export interface ShotDensityMapProps {
  shots: TeamShotLocation[];
  caption: string;
  unlocatedCount?: number;
}

const BAND_FILL = "#1b4f95";

export function ShotDensityMap({ shots, caption, unlocatedCount }: ShotDensityMapProps) {
  const bands = useMemo(() => densityBands(shots), [shots]);
  const goals = shots.filter((shot) => shot.is_goal);

  return (
    <figure className="flex flex-col gap-2">
      <Rink ariaLabel={caption}>
        {bands.map((band, i) => (
          <path
            key={i}
            d={band.d}
            fill={BAND_FILL}
            fillOpacity={0.06 + (0.5 * i) / Math.max(1, bands.length - 1)}
          />
        ))}
        {goals.map((goal, i) => (
          <circle
            key={i}
            cx={svgX(goal.x)}
            cy={svgY(goal.y)}
            r={svgLength(1.1)}
            fill="#e34948"
            fillOpacity={0.9}
          />
        ))}
      </Rink>

      <figcaption className="flex items-center justify-between text-xs text-slate-500">
        <span>{caption}</span>
        <span className="flex items-center gap-3">
          {shots.length > 0 ? <span>{shots.length.toLocaleString()} shots</span> : null}
          {unlocatedCount ? (
            <span>{unlocatedCount.toLocaleString()} without coordinates</span>
          ) : null}
        </span>
      </figcaption>
    </figure>
  );
}
