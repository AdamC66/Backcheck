import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable/DataTable";
import { buildColumns } from "@/lib/buildColumns";
import { formatToi } from "@/lib/format";
import type { SkaterGameStat } from "@/models/gameDetail";

export interface GameSkaterStatsTableProps {
  stats: SkaterGameStat[];
}

const columnHelper = createColumnHelper<SkaterGameStat>();

const COLUMNS = buildColumns(columnHelper, [
  {
    name: (row) => `${row.player.first_name} ${row.player.last_name}`,
    id: "name",
    header: "Player",
    align: "left",
    isRowHeader: true,
  },
  { name: "goals", header: "G", title: "Goals" },
  { name: "assists", header: "A", title: "Assists" },
  { name: "points", header: "P", title: "Points", emphasize: true },
  {
    name: "plus_minus",
    header: "+/-",
    title: "Plus/minus",
    cell: (info) => {
      const value = info.getValue();
      return value > 0 ? `+${value}` : value;
    },
  },
  { name: "pim", header: "PIM", title: "Penalty minutes" },
  { name: "shots_on_goal", header: "SOG", title: "Shots on goal" },
  { name: "hits", header: "HITS", title: "Hits" },
  { name: "blocked_shots", header: "BLK", title: "Blocked shots" },
  {
    name: "time_on_ice_seconds",
    header: "TOI",
    title: "Time on ice",
    cell: (info) => formatToi(info.getValue(), 1),
  },
]);

export function GameSkaterStatsTable({ stats }: GameSkaterStatsTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      data={stats}
      initialSorting={[{ id: "points", desc: true }]}
      getRowId={(row) => String(row.player.id)}
    />
  );
}
