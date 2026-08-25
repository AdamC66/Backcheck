import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable/DataTable";
import type { GoalieSeasonStat } from "@/models/teamStats";

export interface GoalieStatsTableProps {
  stats: GoalieSeasonStat[];
}

const columnHelper = createColumnHelper<GoalieSeasonStat>();

// A ".921" reads as a save percentage; "0.921" or "92.1%" don't, on any stats site.
function formatSavePctg(value: number | null): string {
  return value === null ? "—" : value.toFixed(3).replace(/^0/, "");
}

function formatGaa(value: number | null): string {
  return value === null ? "—" : value.toFixed(2);
}

const COLUMNS = [
  columnHelper.accessor((row) => `${row.player.first_name} ${row.player.last_name}`, {
    id: "name",
    header: "Player",
    meta: { align: "left", isRowHeader: true },
  }),
  columnHelper.accessor("games_played", { header: "GP", meta: { title: "Games played" } }),
  columnHelper.accessor("games_started", { header: "GS", meta: { title: "Games started" } }),
  columnHelper.accessor("wins", { header: "W", meta: { title: "Wins", emphasize: true } }),
  columnHelper.accessor("losses", { header: "L", meta: { title: "Losses" } }),
  columnHelper.accessor("ot_losses", { header: "OTL", meta: { title: "Overtime losses" } }),
  columnHelper.accessor("shutouts", { header: "SO", meta: { title: "Shutouts" } }),
  columnHelper.accessor("save_pctg", {
    header: "SV%",
    cell: (info) => formatSavePctg(info.getValue()),
    meta: { title: "Save percentage" },
  }),
  columnHelper.accessor("goals_against_average", {
    header: "GAA",
    cell: (info) => formatGaa(info.getValue()),
    meta: { title: "Goals against average" },
  }),
  columnHelper.accessor("shots_against", { header: "SA", meta: { title: "Shots against" } }),
  columnHelper.accessor("saves", { header: "SV", meta: { title: "Saves" } }),
];

export function GoalieStatsTable({ stats }: GoalieStatsTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      data={stats}
      initialSorting={[{ id: "wins", desc: true }]}
      getRowId={(row) => String(row.player.id)}
    />
  );
}
