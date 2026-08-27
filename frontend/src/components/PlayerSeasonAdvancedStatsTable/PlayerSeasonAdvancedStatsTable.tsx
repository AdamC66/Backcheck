import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable/DataTable";
import { buildColumns } from "@/lib/buildColumns";
import { formatToi } from "@/lib/format";
import type { PlayerSeasonAdvancedStat } from "@/models/teamStats";

export interface PlayerSeasonAdvancedStatsTableProps {
  stats: PlayerSeasonAdvancedStat[];
}

const columnHelper = createColumnHelper<PlayerSeasonAdvancedStat>();

function corsiForPctg(row: PlayerSeasonAdvancedStat): number | null {
  const total = row.corsi_for + row.corsi_against;
  return total === 0 ? null : row.corsi_for / total;
}

const COLUMNS = buildColumns(columnHelper, [
  {
    name: (row) => `${row.player.first_name} ${row.player.last_name}`,
    id: "name",
    header: "Player",
    align: "left",
    isRowHeader: true,
  },
  { name: "games_played", header: "GP", title: "Games played" },
  { name: "corsi_for", header: "CF", title: "Corsi for" },
  { name: "corsi_against", header: "CA", title: "Corsi against" },
  {
    name: corsiForPctg,
    id: "cf_pctg",
    header: "CF%",
    title: "Corsi for percentage",
    emphasize: true,
    cell: (info) => {
      const value = info.getValue();
      return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
    },
  },
  { name: "fenwick_for", header: "FF", title: "Fenwick for" },
  { name: "fenwick_against", header: "FA", title: "Fenwick against" },
  {
    name: "xg_for",
    header: "xGF",
    title: "Expected goals for",
    cell: (info) => info.getValue().toFixed(2),
  },
  {
    name: "xg_against",
    header: "xGA",
    title: "Expected goals against",
    cell: (info) => info.getValue().toFixed(2),
  },
  {
    name: (row) => (row.games_played === 0 ? 0 : row.toi_seconds / row.games_played),
    id: "toi",
    header: "TOI/GP",
    title: "Average time on ice per game",
    cell: (info) => formatToi(info.row.original.toi_seconds, info.row.original.games_played),
  },
]);

export function PlayerSeasonAdvancedStatsTable({ stats }: PlayerSeasonAdvancedStatsTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      data={stats}
      initialSorting={[{ id: "cf_pctg", desc: true }]}
      getRowId={(row) => String(row.player.id)}
    />
  );
}
