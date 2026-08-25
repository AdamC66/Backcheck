import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable/DataTable";
import { formatToi } from "@/lib/format";
import type { SkaterSeasonStat } from "@/models/teamStats";

export interface SkaterStatsTableProps {
  stats: SkaterSeasonStat[];
}

const columnHelper = createColumnHelper<SkaterSeasonStat>();

const COLUMNS = [
  columnHelper.accessor((row) => `${row.player.first_name} ${row.player.last_name}`, {
    id: "name",
    header: "Player",
    meta: { align: "left", isRowHeader: true },
  }),
  columnHelper.accessor("games_played", { header: "GP", meta: { title: "Games played" } }),
  columnHelper.accessor("goals", { header: "G", meta: { title: "Goals" } }),
  columnHelper.accessor("assists", { header: "A", meta: { title: "Assists" } }),
  columnHelper.accessor("points", {
    header: "P",
    meta: { title: "Points", emphasize: true },
  }),
  columnHelper.accessor("plus_minus", {
    header: "+/-",
    cell: (info) => {
      const value = info.getValue();
      return value > 0 ? `+${value}` : value;
    },
    meta: { title: "Plus/minus" },
  }),
  columnHelper.accessor("pim", { header: "PIM", meta: { title: "Penalty minutes" } }),
  columnHelper.accessor("power_play_goals", {
    header: "PPG",
    meta: { title: "Power-play goals" },
  }),
  columnHelper.accessor("shots_on_goal", { header: "SOG", meta: { title: "Shots on goal" } }),
  columnHelper.accessor("hits", { header: "HITS", meta: { title: "Hits" } }),
  columnHelper.accessor("blocked_shots", { header: "BLK", meta: { title: "Blocked shots" } }),
  columnHelper.accessor(
    (row) => (row.games_played === 0 ? 0 : row.time_on_ice_seconds / row.games_played),
    {
      id: "toi",
      header: "TOI/GP",
      cell: (info) =>
        formatToi(info.row.original.time_on_ice_seconds, info.row.original.games_played),
      meta: { title: "Average time on ice per game" },
    },
  ),
];

export function SkaterStatsTable({ stats }: SkaterStatsTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      data={stats}
      initialSorting={[{ id: "points", desc: true }]}
      getRowId={(row) => String(row.player.id)}
    />
  );
}
