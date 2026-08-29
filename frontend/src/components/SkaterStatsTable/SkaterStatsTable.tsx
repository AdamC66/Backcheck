import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable/DataTable";
import { buildColumns } from "@/lib/buildColumns";
import { formatToi } from "@/lib/format";
import type { SkaterSeasonStat } from "@/models/teamStats";

export interface SkaterStatsTableProps {
  stats: SkaterSeasonStat[];
}

const columnHelper = createColumnHelper<SkaterSeasonStat>();

function shootingPctg(row: SkaterSeasonStat): number | null {
  return row.shots_on_goal === 0 ? null : row.goals / row.shots_on_goal;
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
  { name: "power_play_goals", header: "PPG", title: "Power-play goals" },
  { name: "shots_on_goal", header: "SOG", title: "Shots on goal" },
  {
    name: shootingPctg,
    id: "shooting_pctg",
    header: "SH%",
    title: "Shooting percentage",
    cell: (info) => {
      const value = info.getValue();
      return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
    },
  },
  { name: "hits", header: "HITS", title: "Hits" },
  { name: "blocked_shots", header: "BLK", title: "Blocked shots" },
  { name: "shots_attempted", header: "SATT", title: "Shots attempted" },
  { name: "missed_shots", header: "MISS", title: "Missed shots" },
  { name: "shots_blocked_against", header: "BLKD", title: "Shots blocked by an opponent" },
  { name: "faceoff_wins", header: "FOW", title: "Faceoff wins" },
  { name: "faceoff_losses", header: "FOL", title: "Faceoff losses" },
  {
    name: (row) => (row.games_played === 0 ? 0 : row.time_on_ice_seconds / row.games_played),
    id: "toi",
    header: "TOI/GP",
    title: "Average time on ice per game",
    cell: (info) =>
      formatToi(info.row.original.time_on_ice_seconds, info.row.original.games_played),
  },
]);

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
