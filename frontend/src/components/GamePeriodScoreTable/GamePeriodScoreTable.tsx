import { periodLabel } from "@/lib/format";
import type { GamePeriodSummary } from "@/models/gameDetail";

export interface GamePeriodScoreTableProps {
  summary: GamePeriodSummary;
  awayLabel: string;
  homeLabel: string;
}

interface SideCells {
  label: string;
  line: { goals: number; shots_on_goal: number }[];
  total: { goals: number; shots_on_goal: number };
}

function Cell({ goals, shots }: { goals: number; shots: number }) {
  return (
    <td className="px-3 py-2 text-right tabular-nums">
      <span className="font-semibold text-slate-900">{goals}</span>
      <span className="ml-1 text-xs text-slate-400">{shots}</span>
    </td>
  );
}

function SideRow({ label, line, total }: SideCells) {
  return (
    <tr className="border-t border-slate-100">
      <th scope="row" className="px-3 py-2 text-left font-medium whitespace-nowrap">
        {label}
      </th>
      {line.map((cell, index) => (
        <Cell key={index} goals={cell.goals} shots={cell.shots_on_goal} />
      ))}
      <Cell goals={total.goals} shots={total.shots_on_goal} />
    </tr>
  );
}

export function GamePeriodScoreTable({ summary, awayLabel, homeLabel }: GamePeriodScoreTableProps) {
  if (summary.periods.length === 0) {
    return null;
  }

  return (
    <table className="w-fit border-collapse text-sm">
      <caption className="px-3 pb-2 text-left text-xs text-slate-500">
        goals · <span className="text-slate-400">shots on goal</span>
      </caption>
      <thead>
        <tr>
          <th scope="col" className="px-3 py-2 text-left font-medium"></th>
          {summary.periods.map((line) => (
            <th key={line.period} scope="col" className="px-3 py-2 text-right font-medium">
              {periodLabel(line.period)}
            </th>
          ))}
          <th scope="col" className="px-3 py-2 text-right font-medium">
            T
          </th>
        </tr>
      </thead>
      <tbody>
        <SideRow
          label={awayLabel}
          line={summary.periods.map((line) => line.away)}
          total={summary.totals.away}
        />
        <SideRow
          label={homeLabel}
          line={summary.periods.map((line) => line.home)}
          total={summary.totals.home}
        />
      </tbody>
    </table>
  );
}
