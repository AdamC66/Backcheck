import type { DangerZoneGeometry } from "@/models/dangerZones";

const PX_PER_FOOT = 6;

// Feet, origin at center ice, +x toward the attacking net — the same frame the backend
// coordinates and DangerZone polygon use. Components render the offensive half, net on the right.
export const RINK = {
  originX: 0,
  endBoardsX: 100,
  halfWidth: 42.5,
  cornerRadius: 28,
  blueLineX: 25,
  goalLineX: 89,
  faceoffDotX: 69,
  faceoffCircleY: 22,
  faceoffCircleRadius: 15,
  faceoffDotRadius: 1,
  paintedCreaseRadius: 6,
  netHalfWidth: 3,
  netDepth: 3.33,
} as const;

export const RINK_VIEW = {
  width: (RINK.endBoardsX - RINK.originX) * PX_PER_FOOT,
  height: RINK.halfWidth * 2 * PX_PER_FOOT,
};

export const svgX = (feet: number) => (feet - RINK.originX) * PX_PER_FOOT;
export const svgY = (feet: number) => (RINK.halfWidth - feet) * PX_PER_FOOT;
export const svgLength = (feet: number) => feet * PX_PER_FOOT;

// Full sheet, center ice at x = 0, x ranging -endBoardsX..endBoardsX. y is unchanged,
// so svgY works in both frames.
export const RINK_FULL_VIEW = {
  width: RINK.endBoardsX * 2 * PX_PER_FOOT,
  height: RINK.halfWidth * 2 * PX_PER_FOOT,
};

export const fullSvgX = (feet: number) => (feet + RINK.endBoardsX) * PX_PER_FOOT;

export function fullBoardsPath(): string {
  const { endBoardsX: e, halfWidth: h, cornerRadius: r } = RINK;

  return [
    `M ${fullSvgX(-e + r)},${svgY(h)}`,
    `L ${fullSvgX(e - r)},${svgY(h)}`,
    `Q ${fullSvgX(e)},${svgY(h)} ${fullSvgX(e)},${svgY(h - r)}`,
    `L ${fullSvgX(e)},${svgY(-h + r)}`,
    `Q ${fullSvgX(e)},${svgY(-h)} ${fullSvgX(e - r)},${svgY(-h)}`,
    `L ${fullSvgX(-e + r)},${svgY(-h)}`,
    `Q ${fullSvgX(-e)},${svgY(-h)} ${fullSvgX(-e)},${svgY(-h + r)}`,
    `L ${fullSvgX(-e)},${svgY(h - r)}`,
    `Q ${fullSvgX(-e)},${svgY(h)} ${fullSvgX(-e + r)},${svgY(h)}`,
    "Z",
  ].join(" ");
}

export function boardsPath(): string {
  const { endBoardsX, halfWidth, cornerRadius: r } = RINK;

  return [
    `M ${svgX(0)},${svgY(halfWidth)}`,
    `L ${svgX(endBoardsX - r)},${svgY(halfWidth)}`,
    `Q ${svgX(endBoardsX)},${svgY(halfWidth)} ${svgX(endBoardsX)},${svgY(halfWidth - r)}`,
    `L ${svgX(endBoardsX)},${svgY(-halfWidth + r)}`,
    `Q ${svgX(endBoardsX)},${svgY(-halfWidth)} ${svgX(endBoardsX - r)},${svgY(-halfWidth)}`,
    `L ${svgX(0)},${svgY(-halfWidth)}`,
    "Z",
  ].join(" ");
}

export function highDangerPolygonPoints(geometry: DangerZoneGeometry): string {
  return geometry.high_danger_polygon.map(([x, y]) => `${svgX(x)},${svgY(y)}`).join(" ");
}

// Uses high_danger_crease_radius_ft, not the painted 6ft crease — this arc is the classifier's
// "close at any angle" rule, and must track the backend value.
export function highDangerCreasePath(geometry: DangerZoneGeometry): string {
  const gx = geometry.goal_line_x;
  const r = geometry.high_danger_crease_radius_ft;

  return [
    `M ${svgX(gx)},${svgY(r)}`,
    `A ${svgLength(r)} ${svgLength(r)} 0 0 0 ${svgX(gx)},${svgY(-r)}`,
    "Z",
  ].join(" ");
}

// Clip to the boards when rendering — this circle overruns them.
export function midRangeCircle(geometry: DangerZoneGeometry) {
  return {
    cx: svgX(geometry.goal_line_x),
    cy: svgY(0),
    r: svgLength(geometry.mid_range_max_distance_ft),
  };
}

function pointInHighDanger(geometry: DangerZoneGeometry, x: number, y: number): boolean {
  const gx = geometry.goal_line_x;
  if (Math.hypot(gx - x, y) <= geometry.high_danger_crease_radius_ft) return true;

  const poly = geometry.high_danger_polygon;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// On-ice area of each zone, sampled on a 1ft grid (the mid/long circle is clipped by the
// boards, so this can't be a closed-form area). Used to shade a zone chart by shot density.
export function zoneAreas(geometry: DangerZoneGeometry): {
  highDanger: number;
  midRange: number;
  longRange: number;
} {
  const areas = { highDanger: 0, midRange: 0, longRange: 0 };
  const { endBoardsX, halfWidth, cornerRadius: r } = RINK;
  const gx = geometry.goal_line_x;

  for (let x = 0.5; x < endBoardsX; x += 1) {
    for (let y = -halfWidth + 0.5; y < halfWidth; y += 1) {
      const cornerX = x - (endBoardsX - r);
      const cornerY = Math.abs(y) - (halfWidth - r);
      if (cornerX > 0 && cornerY > 0 && Math.hypot(cornerX, cornerY) > r) continue;

      if (pointInHighDanger(geometry, x, y)) areas.highDanger += 1;
      else if (Math.hypot(gx - x, y) <= geometry.mid_range_max_distance_ft) areas.midRange += 1;
      else areas.longRange += 1;
    }
  }
  return areas;
}
