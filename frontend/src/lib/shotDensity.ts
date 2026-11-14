import { contourDensity } from "d3-contour";
import { RINK_VIEW, svgX, svgY } from "@/lib/rink";

export interface DensityPoint {
  x: number;
  y: number;
}

export interface DensityBand {
  value: number;
  d: string;
}

interface DensityOptions {
  bandwidth?: number;
  thresholds?: number;
}

// KDE + marching squares over the half-rink viewBox. Points come in as feet in the
// offensive frame (net at +x); we project to viewBox px first so the contour geometry
// lands directly on the <Rink> without a further transform.
export function densityBands(points: DensityPoint[], options: DensityOptions = {}): DensityBand[] {
  if (points.length === 0) return [];

  const contours = contourDensity<DensityPoint>()
    .x((point) => svgX(point.x))
    .y((point) => svgY(point.y))
    .size([RINK_VIEW.width, RINK_VIEW.height])
    // ponytail: bandwidth/thresholds eyeballed, not tuned against a full season of live
    // shots yet — expose as props on the caller if a team's map reads too smooth/blobby.
    .bandwidth(options.bandwidth ?? 22)
    .thresholds(options.thresholds ?? 12)(points);

  return contours
    .filter((contour) => contour.value > 0)
    .map((contour) => ({ value: contour.value, d: multiPolygonPath(contour.coordinates) }));
}

function multiPolygonPath(polygons: number[][][][]): string {
  const parts: string[] = [];

  for (const polygon of polygons) {
    for (const ring of polygon) {
      ring.forEach(([x, y], i) => {
        parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
      });
      parts.push("Z");
    }
  }

  return parts.join(" ");
}
