import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable/DataTable";
import { buildColumns } from "@/lib/buildColumns";
import { formatSavePctg, formatToi } from "@/lib/format";
import type { GoalieGameStat } from "@/models/gameDetail";

export interface GameGoalieStatsTableProps {
  stats: GoalieGameStat[];
}

const columnHelper = createColumnHelper<GoalieGameStat>();

const DECISION_LABELS: Record<string, string> = { W: "W", L: "L", O: "OTL" };

function formatDecision(value: string | null): string {
  return value === null ? "—" : (DECISION_LABELS[value] ?? value);
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
    name: "decision",
    header: "DEC",
    title: "Decision",
    cell: (info) => formatDecision(info.getValue()),
  },
  { name: "saves", header: "SV", title: "Saves", emphasize: true },
  { name: "shots_against", header: "SA", title: "Shots against" },
  { name: "goals_against", header: "GA", title: "Goals against" },
  {
    name: "save_pctg",
    header: "SV%",
    title: "Save percentage",
    cell: (info) => formatSavePctg(info.getValue()),
  },
  {
    name: "time_on_ice_seconds",
    header: "TOI",
    title: "Time on ice",
    cell: (info) => formatToi(info.getValue(), 1),
  },
]);

export function GameGoalieStatsTable({ stats }: GameGoalieStatsTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      data={stats}
      initialSorting={[{ id: "saves", desc: true }]}
      getRowId={(row) => String(row.player.id)}
    />
  );
}
