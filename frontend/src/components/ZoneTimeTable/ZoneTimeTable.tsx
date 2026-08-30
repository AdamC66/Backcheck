import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable/DataTable";
import { buildColumns } from "@/lib/buildColumns";
import type { ZoneTimeSkater } from "@/models/gameDetail";

export interface ZoneTimeTableProps {
  skaters: ZoneTimeSkater[];
}

const columnHelper = createColumnHelper<ZoneTimeSkater>();

function zonePct(row: ZoneTimeSkater, key: keyof ZoneTimeSkater["seconds"]): number | null {
  const total = row.seconds.offensive + row.seconds.neutral + row.seconds.defensive;
  return total === 0 ? null : (100 * row.seconds[key]) / total;
}

function formatPct(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`;
}

const COLUMNS = buildColumns(columnHelper, [
  {
    name: (row) => `${row.player.first_name} ${row.player.last_name}`,
    id: "name",
    header: "Player",
    align: "left",
    isRowHeader: true,
  },
  {
    name: (row) => row.starts.offensive,
    id: "ozs",
    header: "OZS",
    title: "Offensive-zone faceoff starts",
  },
  {
    name: (row) => row.starts.neutral,
    id: "nzs",
    header: "NZS",
    title: "Neutral-zone faceoff starts",
  },
  {
    name: (row) => row.starts.defensive,
    id: "dzs",
    header: "DZS",
    title: "Defensive-zone faceoff starts",
  },
  { name: (row) => row.starts.on_the_fly, id: "otf", header: "OTF", title: "On-the-fly starts" },
  {
    name: (row) => zonePct(row, "offensive") ?? -1,
    id: "oz_pct",
    header: "OZ%",
    title: "Share of shift time in the offensive zone",
    cell: (info) => formatPct(zonePct(info.row.original, "offensive")),
  },
  {
    name: (row) => zonePct(row, "neutral") ?? -1,
    id: "nz_pct",
    header: "NZ%",
    title: "Share of shift time in the neutral zone",
    cell: (info) => formatPct(zonePct(info.row.original, "neutral")),
  },
  {
    name: (row) => zonePct(row, "defensive") ?? -1,
    id: "dz_pct",
    header: "DZ%",
    title: "Share of shift time in the defensive zone",
    emphasize: true,
    cell: (info) => formatPct(zonePct(info.row.original, "defensive")),
  },
]);

export function ZoneTimeTable({ skaters }: ZoneTimeTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      data={skaters}
      initialSorting={[{ id: "dzs", desc: true }]}
      getRowId={(row) => String(row.player.id)}
    />
  );
}
