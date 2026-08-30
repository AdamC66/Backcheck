import { ZONE_COLOR } from "@/lib/zoneColors";
import type { Zone } from "@/models/gameDetail";

export interface ZoneShareRow {
  label: string;
  offensiveSeconds: number;
  neutralSeconds: number;
  defensiveSeconds: number;
}

export interface GameZoneShareBarProps {
  rows: ZoneShareRow[];
}

const ORDER: Zone[] = ["offensive", "neutral", "defensive"];

function secondsFor(row: ZoneShareRow, zone: Zone): number {
  if (zone === "offensive") return row.offensiveSeconds;
  if (zone === "neutral") return row.neutralSeconds;
  return row.defensiveSeconds;
}

export function GameZoneShareBar({ rows }: GameZoneShareBarProps) {
  return (
    <div className="max-w-lg">
      <div className="flex flex-col gap-2">
        {rows.map((row) => {
          const total = row.offensiveSeconds + row.neutralSeconds + row.defensiveSeconds || 1;
          return (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-10 shrink-0 text-xs font-medium text-slate-600">{row.label}</span>
              <div className="flex h-6 flex-1 overflow-hidden">
                {ORDER.map((zone) => {
                  const pct = (100 * secondsFor(row, zone)) / total;
                  return (
                    <div
                      key={zone}
                      className="flex items-center justify-center text-[11px] font-medium text-white tabular-nums"
                      style={{ width: `${pct}%`, backgroundColor: ZONE_COLOR[zone] }}
                    >
                      {pct >= 8 ? `${Math.round(pct)}%` : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Share of game time each team spent attacking (blue), in the neutral zone (grey), and
        defending (red).
      </p>
    </div>
  );
}
