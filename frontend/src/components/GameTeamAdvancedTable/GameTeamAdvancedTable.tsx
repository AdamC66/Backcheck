import type { TeamGameAdvancedStat } from "@/models/gameDetail";

export interface GameTeamAdvancedTableProps {
  awayLabel: string;
  homeLabel: string;
  away: TeamGameAdvancedStat | undefined;
  home: TeamGameAdvancedStat | undefined;
}

function corsiForPctg(stat: TeamGameAdvancedStat): number | null {
  const total = stat.corsi_for + stat.corsi_against;
  return total === 0 ? null : stat.corsi_for / total;
}

// One row per stat, one column per team — each team's own "for" total already carries
// the whole picture, since its "against" is just the other team's "for".
export function GameTeamAdvancedTable({
  awayLabel,
  homeLabel,
  away,
  home,
}: GameTeamAdvancedTableProps) {
  if (away === undefined || home === undefined) {
    return null;
  }

  const awayCf = corsiForPctg(away);

  return (
    <table className="w-fit border-collapse text-sm">
      <thead>
        <tr>
          <th scope="col" className="px-3 py-2 text-left font-medium whitespace-nowrap"></th>
          <th scope="col" className="px-3 py-2 text-right font-medium whitespace-nowrap">
            {awayLabel}
          </th>
          <th scope="col" className="px-3 py-2 text-right font-medium whitespace-nowrap">
            {homeLabel}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-t border-slate-100">
          <th
            scope="row"
            className="px-3 py-2 text-left font-normal whitespace-nowrap text-slate-500"
          >
            Corsi for
          </th>
          <td className="px-3 py-2 text-right tabular-nums">{away.corsi_for}</td>
          <td className="px-3 py-2 text-right tabular-nums">{home.corsi_for}</td>
        </tr>
        <tr className="border-t border-slate-100">
          <th
            scope="row"
            className="px-3 py-2 text-left font-normal whitespace-nowrap text-slate-500"
          >
            CF%
          </th>
          <td className="px-3 py-2 text-right font-semibold tabular-nums">
            {awayCf === null ? "—" : `${(awayCf * 100).toFixed(1)}%`}
          </td>
          <td className="px-3 py-2 text-right font-semibold tabular-nums">
            {awayCf === null ? "—" : `${((1 - awayCf) * 100).toFixed(1)}%`}
          </td>
        </tr>
        <tr className="border-t border-slate-100">
          <th
            scope="row"
            className="px-3 py-2 text-left font-normal whitespace-nowrap text-slate-500"
          >
            Fenwick for
          </th>
          <td className="px-3 py-2 text-right tabular-nums">{away.fenwick_for}</td>
          <td className="px-3 py-2 text-right tabular-nums">{home.fenwick_for}</td>
        </tr>
        <tr className="border-t border-slate-100">
          <th
            scope="row"
            className="px-3 py-2 text-left font-normal whitespace-nowrap text-slate-500"
          >
            xG for
          </th>
          <td className="px-3 py-2 text-right tabular-nums">{away.xg_for.toFixed(2)}</td>
          <td className="px-3 py-2 text-right tabular-nums">{home.xg_for.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  );
}
