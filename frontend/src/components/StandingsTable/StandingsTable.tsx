import { Fragment } from "react";
import type { RankKey } from "@/lib/standingsViews";
import type { Standing, StandingRecord } from "@/models/standings";

export interface StandingsTableProps {
  standings: Standing[];
  rankKey?: RankKey;
  rankPrefix?: string;
  cutlineAfter?: number;
}

const NUMERIC_COLUMNS = [
  { key: "games_played", label: "GP", title: "Games played" },
  { key: "wins", label: "W", title: "Wins" },
  { key: "losses", label: "L", title: "Losses" },
  { key: "ot_losses", label: "OTL", title: "Overtime losses" },
  { key: "points", label: "PTS", title: "Points" },
] as const;

const COLUMN_COUNT = 2 + NUMERIC_COLUMNS.length + 4;

const HEADER_CELL = "px-3 py-2 font-medium whitespace-nowrap";
const NUMERIC_CELL = "px-3 py-2 text-right tabular-nums whitespace-nowrap";

function formatRecord({ wins, losses, ot_losses }: StandingRecord) {
  return `${wins}-${losses}-${ot_losses}`;
}

// A points percentage reads as .738, not 0.738 or 73.8%.
function formatPointPctg(value: number | null) {
  return value === null ? "—" : value.toFixed(3).replace(/^0/, "");
}

function formatStreak(code: string | null, count: number | null) {
  return code === null || count === null ? "—" : `${code}${count}`;
}

function differentialTone(differential: number) {
  if (differential > 0) return "text-emerald-600";

  return differential < 0 ? "text-red-600" : "text-slate-500";
}

export function StandingsTable({
  standings,
  rankKey = "league_sequence",
  rankPrefix = "",
  cutlineAfter,
}: StandingsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-3xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase">
            <th scope="col" className={`${HEADER_CELL} text-right`}>
              #
            </th>
            <th scope="col" className={`${HEADER_CELL} text-left`}>
              Team
            </th>
            {NUMERIC_COLUMNS.map((column) => (
              <th
                key={column.key}
                scope="col"
                title={column.title}
                className={`${HEADER_CELL} text-right`}
              >
                {column.label}
              </th>
            ))}
            <th scope="col" title="Points percentage" className={`${HEADER_CELL} text-right`}>
              P%
            </th>
            <th scope="col" title="Goal differential" className={`${HEADER_CELL} text-right`}>
              DIFF
            </th>
            <th
              scope="col"
              title="Record over the last ten games"
              className={`${HEADER_CELL} text-right`}
            >
              L10
            </th>
            <th scope="col" title="Current streak" className={`${HEADER_CELL} text-right`}>
              STRK
            </th>
          </tr>
        </thead>

        <tbody>
          {standings.map((standing, index) => (
            <Fragment key={standing.team.id}>
              <tr className="border-b border-slate-100 last:border-0">
                <td className={`${NUMERIC_CELL} text-slate-500`}>
                  {`${rankPrefix}${standing[rankKey] ?? index + 1}`}
                </td>

                <th scope="row" className="px-3 py-2 text-left font-medium text-slate-800">
                  <span className="flex items-center gap-2">
                    {standing.team.logo_url === null ? null : (
                      <img src={standing.team.logo_url} alt="" className="h-5 w-5 object-contain" />
                    )}
                    <span className="whitespace-nowrap">{standing.team.name}</span>
                  </span>
                </th>

                {NUMERIC_COLUMNS.map((column) => (
                  <td
                    key={column.key}
                    className={`${NUMERIC_CELL} ${column.key === "points" ? "font-semibold text-slate-900" : "text-slate-700"}`}
                  >
                    {standing[column.key]}
                  </td>
                ))}

                <td className={`${NUMERIC_CELL} text-slate-700`}>
                  {formatPointPctg(standing.point_pctg)}
                </td>
                <td className={`${NUMERIC_CELL} ${differentialTone(standing.goal_differential)}`}>
                  {standing.goal_differential > 0
                    ? `+${standing.goal_differential}`
                    : standing.goal_differential}
                </td>
                <td className={`${NUMERIC_CELL} text-slate-700`}>
                  {formatRecord(standing.l10_record)}
                </td>
                <td className={`${NUMERIC_CELL} text-slate-700`}>
                  {formatStreak(standing.streak_code, standing.streak_count)}
                </td>
              </tr>

              {cutlineAfter === index ? (
                <tr>
                  <td
                    colSpan={COLUMN_COUNT}
                    className="border-y-2 border-dashed border-slate-300 px-3 py-1 text-xs tracking-wide text-slate-500 uppercase"
                  >
                    Playoff cut
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
