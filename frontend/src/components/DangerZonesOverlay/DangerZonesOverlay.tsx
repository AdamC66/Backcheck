import type { DangerZoneGeometry } from "@/models/dangerZones";
import {
  highDangerCreasePath,
  highDangerPolygonPoints,
  midRangeCircle,
  svgX,
  svgY,
} from "@/lib/rink";

export interface DangerZonesOverlayProps {
  geometry: DangerZoneGeometry;
  showLabels?: boolean;
}

const FILL = "#2a78d6";
const LABEL_INK = "#334155";

interface ZoneLabel {
  text: string;
  x: number;
  y: number;
}

const LABELS: ZoneLabel[] = [
  { text: "High danger", x: 69, y: 0 },
  { text: "Mid-range", x: 50, y: 31 },
  { text: "Long range", x: 33, y: -33 },
];

export function DangerZonesOverlay({ geometry, showLabels = true }: DangerZonesOverlayProps) {
  const circle = midRangeCircle(geometry);

  return (
    <g>
      <circle cx={circle.cx} cy={circle.cy} r={circle.r} fill={FILL} fillOpacity={0.16} />
      <polygon points={highDangerPolygonPoints(geometry)} fill={FILL} fillOpacity={0.28} />
      <path d={highDangerCreasePath(geometry)} fill={FILL} fillOpacity={0.28} />

      <circle
        cx={circle.cx}
        cy={circle.cy}
        r={circle.r}
        fill="none"
        stroke={FILL}
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />
      <polygon
        points={highDangerPolygonPoints(geometry)}
        fill="none"
        stroke={FILL}
        strokeWidth={1.75}
      />

      {showLabels
        ? LABELS.map((label) => (
            <text
              key={label.text}
              x={svgX(label.x)}
              y={svgY(label.y)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={17}
              fontWeight={600}
              fill={LABEL_INK}
              stroke="white"
              strokeWidth={4}
              paintOrder="stroke"
            >
              {label.text}
            </text>
          ))
        : null}
    </g>
  );
}
