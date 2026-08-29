import { CoverageCell } from "@/components/CoverageCell/CoverageCell";
import { COVERAGE_KIND_LABELS, type CoverageKind, type CoverageRow } from "@/models/coverage";

const KINDS: CoverageKind[] = ["games", "roster", "stats", "advanced"];

export interface CoverageMatrixProps {
  rows: CoverageRow[];
  onSync: (row: CoverageRow, kind: CoverageKind) => void;
}

const HEAD = "px-3 py-2 text-left font-medium";

export function CoverageMatrix({ rows, onSync }: CoverageMatrixProps) {
  return (
    <div className="overflow-x-auto border border-slate-200 bg-white">
      <table className="w-full min-w-3xl text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase">
            <th scope="col" className={HEAD}>
              Season
            </th>
            {KINDS.map((kind) => (
              <th key={kind} scope="col" className={HEAD}>
                {COVERAGE_KIND_LABELS[kind]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.season_id} className="border-b border-slate-100 align-top last:border-0">
              <th scope="row" className="px-3 py-3 text-left font-medium text-slate-800">
                {row.season_label}
              </th>
              {KINDS.map((kind) => (
                <td key={kind} className="px-3 py-3">
                  <CoverageCell
                    cell={row[kind]}
                    seasonId={row.season_id}
                    kind={kind}
                    onSync={() => onSync(row, kind)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
