import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable/DataTable";
import { buildColumns } from "@/lib/buildColumns";
import type { PlayerGoalieSeason } from "@/models/playerDetail";

export interface PlayerGoalieSeasonsTableProps {
  seasons: PlayerGoalieSeason[];
}

const columnHelper = createColumnHelper<PlayerGoalieSeason>();

// A ".921" reads as a save percentage; "0.921" or "92.1%" don't, on any stats site.
function formatSavePctg(value: number | null): string {
  return value === null ? "—" : value.toFixed(3).replace(/^0/, "");
}

function formatGaa(value: number | null): string {
  return value === null ? "—" : value.toFixed(2);
}

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
  { name: "games_started", header: "GS", title: "Games started" },
  { name: "wins", header: "W", title: "Wins", emphasize: true },
  { name: "losses", header: "L", title: "Losses" },
  { name: "ot_losses", header: "OTL", title: "Overtime losses" },
  { name: "shutouts", header: "SO", title: "Shutouts" },
  {
    name: "save_pctg",
    header: "SV%",
    title: "Save percentage",
    cell: (info) => formatSavePctg(info.getValue()),
  },
  {
    name: "goals_against_average",
    header: "GAA",
    title: "Goals against average",
    cell: (info) => formatGaa(info.getValue()),
  },
  { name: "shots_against", header: "SA", title: "Shots against" },
  { name: "saves", header: "SV", title: "Saves" },
]);

export function PlayerGoalieSeasonsTable({ seasons }: PlayerGoalieSeasonsTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      data={seasons}
      getRowId={(row) => `${row.season.id}-${row.team.id}`}
    />
  );
}
