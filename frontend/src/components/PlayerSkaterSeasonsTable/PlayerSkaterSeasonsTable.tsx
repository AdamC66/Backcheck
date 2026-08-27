import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable/DataTable";
import { buildColumns } from "@/lib/buildColumns";
import { formatToi } from "@/lib/format";
import type { PlayerSkaterSeason } from "@/models/playerDetail";

export interface PlayerSkaterSeasonsTableProps {
  seasons: PlayerSkaterSeason[];
}

const columnHelper = createColumnHelper<PlayerSkaterSeason>();

const COLUMNS = buildColumns(columnHelper, [
  {
    name: (row) => row.season.label,
    id: "season",
    header: "Season",
    align: "left",
    isRowHeader: true,
  },
  { name: (row) => row.team.abbreviation, id: "team", header: "Team", align: "left" },
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
  { name: "hits", header: "HITS", title: "Hits" },
  { name: "blocked_shots", header: "BLK", title: "Blocked shots" },
  {
    name: (row) => (row.games_played === 0 ? 0 : row.time_on_ice_seconds / row.games_played),
    id: "toi",
    header: "TOI/GP",
    title: "Average time on ice per game",
    cell: (info) =>
      formatToi(info.row.original.time_on_ice_seconds, info.row.original.games_played),
  },
]);

export function PlayerSkaterSeasonsTable({ seasons }: PlayerSkaterSeasonsTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      data={seasons}
      getRowId={(row) => `${row.season.id}-${row.team.id}`}
    />
  );
}
