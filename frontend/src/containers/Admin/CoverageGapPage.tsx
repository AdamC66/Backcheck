import { Link, Navigate, useParams } from "react-router";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import {
  COVERAGE_KIND_LABELS,
  type CoverageGameGap,
  type CoverageGapRow,
  type CoverageKind,
  type CoverageTeamGap,
} from "@/models/coverage";
import { useCoverageGaps } from "@/models/useCoverageGaps";

const KINDS: CoverageKind[] = ["games", "roster", "stats", "advanced"];

function isGameGap(row: CoverageGapRow): row is CoverageGameGap {
  return "game_id" in row;
}

const HEAD = "px-3 py-2 text-left font-medium";
const CELL = "px-3 py-2";

function GameGapRow({ row }: { row: CoverageGameGap }) {
  return (
    <tr className={`border-b border-slate-100 last:border-0 ${row.present ? "" : "bg-amber-50"}`}>
      <td className={CELL}>
        <Link to={`/games/${row.game_id}`} className="font-medium hover:underline">
          {row.matchup}
        </Link>
      </td>
      <td className={CELL}>{row.game_date}</td>
      <td className={CELL}>{row.state}</td>
      <td className={CELL}>
        {row.present ? (
          <Text variant="caption" className="text-emerald-700">
            synced
          </Text>
        ) : (
          <Text variant="caption" className="text-amber-700">
            missing
          </Text>
        )}
        {row.flagged ? (
          <Text variant="caption" tone="muted">
            {" "}
            · {row.flag}
          </Text>
        ) : null}
      </td>
    </tr>
  );
}

function TeamGapRow({ row, kind }: { row: CoverageTeamGap; kind: CoverageKind }) {
  const missing = kind === "roster" ? row.present === false : (row.missing ?? 0) > 0;

  return (
    <tr className={`border-b border-slate-100 last:border-0 ${missing ? "bg-amber-50" : ""}`}>
      <td className={`${CELL} font-medium`}>{row.team_name}</td>
      {kind === "roster" ? (
        <td className={CELL}>{row.roster_spots} roster spots</td>
      ) : (
        <td className={CELL}>
          {row.synced} synced
          {row.expected == null ? "" : ` / ${row.expected} expected`}
          {(row.missing ?? 0) > 0 ? ` · ${row.missing} missing` : ""}
        </td>
      )}
    </tr>
  );
}

export function CoverageGapPage() {
  const { seasonId, kind } = useParams();
  const numericSeasonId = Number(seasonId);
  const valid =
    Number.isInteger(numericSeasonId) &&
    numericSeasonId > 0 &&
    KINDS.includes(kind as CoverageKind);

  const gaps = useCoverageGaps(valid ? numericSeasonId : null, kind ?? "");

  if (!valid) {
    return <Navigate to="/admin/data" replace />;
  }

  const coverageKind = kind as CoverageKind;
  const perGame = coverageKind === "stats" || coverageKind === "advanced";

  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <Link to="/admin/data" className="text-xs text-slate-500 uppercase hover:text-slate-800">
          ← Data coverage
        </Link>
        <Text variant="subheading">{COVERAGE_KIND_LABELS[coverageKind]} coverage</Text>
      </Stack>

      {gaps.isPending ? <Text tone="muted">Loading…</Text> : null}
      {gaps.isError ? <Text tone="danger">Could not load this breakdown.</Text> : null}
      {gaps.data?.data.length === 0 ? <Text tone="muted">Nothing to show.</Text> : null}

      {gaps.data?.data.length ? (
        <div className="overflow-x-auto border border-slate-200 bg-white">
          <table className="w-full min-w-3xl text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase">
                {perGame ? (
                  <>
                    <th className={HEAD}>Matchup</th>
                    <th className={HEAD}>Date</th>
                    <th className={HEAD}>State</th>
                    <th className={HEAD}>Coverage</th>
                  </>
                ) : (
                  <>
                    <th className={HEAD}>Team</th>
                    <th className={HEAD}>Coverage</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {gaps.data.data.map((row) =>
                isGameGap(row) ? (
                  <GameGapRow key={row.game_id} row={row} />
                ) : (
                  <TeamGapRow key={row.team_id} row={row} kind={coverageKind} />
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </Stack>
  );
}
