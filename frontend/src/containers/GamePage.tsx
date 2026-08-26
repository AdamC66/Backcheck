import { useParams } from "react-router";
import { GameGoalieStatsTable } from "@/components/GameGoalieStatsTable/GameGoalieStatsTable";
import { GameSkaterStatsTable } from "@/components/GameSkaterStatsTable/GameSkaterStatsTable";
import { PageShell } from "@/components/PageShell/PageShell";
import { PlayerAdvancedStatsTable } from "@/components/PlayerAdvancedStatsTable/PlayerAdvancedStatsTable";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { UserMenu } from "@/containers/UserMenu";
import { formatGameDateTime } from "@/lib/format";
import type { TeamGameAdvancedStat } from "@/models/gameDetail";
import { useGameDetail } from "@/models/useGameDetail";

function bySide<T extends { team_id: number }>(rows: T[], teamId: number): T[] {
  return rows.filter((row) => row.team_id === teamId);
}

function corsiForPctg(stat: TeamGameAdvancedStat): number | null {
  const total = stat.corsi_for + stat.corsi_against;
  return total === 0 ? null : stat.corsi_for / total;
}

interface TeamAdvancedTableProps {
  awayLabel: string;
  homeLabel: string;
  away: TeamGameAdvancedStat | undefined;
  home: TeamGameAdvancedStat | undefined;
}

// One row per stat, one column per team — each team's own "for" total already carries
// the whole picture, since its "against" is just the other team's "for".
function TeamAdvancedTable({ awayLabel, homeLabel, away, home }: TeamAdvancedTableProps) {
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
          <td className="px-3 py-2 text-right tabular-nums font-semibold">
            {awayCf === null ? "—" : `${(awayCf * 100).toFixed(1)}%`}
          </td>
          <td className="px-3 py-2 text-right tabular-nums font-semibold">
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

export function GamePage() {
  const { id } = useParams();
  const gameId = id === undefined ? null : Number(id);
  const detail = useGameDetail(gameId);

  if (detail.isPending) {
    return (
      <PageShell actions={<UserMenu />}>
        <Text tone="muted">Loading game…</Text>
      </PageShell>
    );
  }

  if (detail.isError) {
    return (
      <PageShell actions={<UserMenu />}>
        <Text tone="danger">Could not load this game.</Text>
      </PageShell>
    );
  }

  const { game, skaters, goalies, advanced } = detail.data.data;
  const statsSyncing = detail.data.meta?.stats_syncing === true;

  return (
    <PageShell actions={<UserMenu />} width="wide">
      <Stack gap="lg">
        <Stack gap="xs">
          <Row gap="md" align="baseline">
            {game.away.team.logo_url === null ? null : (
              <img
                src={game.away.team.logo_url}
                alt=""
                className="h-8 w-8 shrink-0 object-contain"
              />
            )}
            <Text variant="heading" className="font-display tracking-wide">
              {game.away.team.name} {game.away.score ?? "–"} @ {game.home.team.name}{" "}
              {game.home.score ?? "–"}
            </Text>
            {game.home.team.logo_url === null ? null : (
              <img
                src={game.home.team.logo_url}
                alt=""
                className="h-8 w-8 shrink-0 object-contain"
              />
            )}
          </Row>
          <Text tone="muted" variant="caption">
            {formatGameDateTime(game.starts_at)}
            {game.venue === null ? "" : ` · ${game.venue}`}
          </Text>
          {statsSyncing ? (
            <Text tone="muted" variant="caption">
              Advanced stats are recalculating for this game — numbers may change shortly.
            </Text>
          ) : null}
        </Stack>

        {advanced.teams.length === 0 ? null : (
          <div className="overflow-x-auto">
            <TeamAdvancedTable
              awayLabel={game.away.team.abbreviation}
              homeLabel={game.home.team.abbreviation}
              away={advanced.teams.find((stat) => stat.team_id === game.away.team.id)}
              home={advanced.teams.find((stat) => stat.team_id === game.home.team.id)}
            />
          </div>
        )}

        <Stack gap="sm">
          <Text variant="label" className="font-bold tracking-wide text-slate-500 uppercase">
            Skaters
          </Text>
          {skaters.length === 0 ? (
            <Text tone="muted">No skater stats recorded for this game yet.</Text>
          ) : (
            <Stack gap="md">
              <GameSkaterStatsTable stats={bySide(skaters, game.away.team.id)} />
              <GameSkaterStatsTable stats={bySide(skaters, game.home.team.id)} />
            </Stack>
          )}
        </Stack>

        <Stack gap="sm">
          <Text variant="label" className="font-bold tracking-wide text-slate-500 uppercase">
            Goalies
          </Text>
          {goalies.length === 0 ? (
            <Text tone="muted">No goalie stats recorded for this game yet.</Text>
          ) : (
            <Stack gap="md">
              <GameGoalieStatsTable stats={bySide(goalies, game.away.team.id)} />
              <GameGoalieStatsTable stats={bySide(goalies, game.home.team.id)} />
            </Stack>
          )}
        </Stack>

        <Stack gap="sm">
          <Text variant="label" className="font-bold tracking-wide text-slate-500 uppercase">
            Advanced (per player)
          </Text>
          {advanced.players.length === 0 ? (
            <Text tone="muted">
              No advanced stats recorded for this game yet{statsSyncing ? " — still syncing." : "."}
            </Text>
          ) : (
            <Stack gap="md">
              <PlayerAdvancedStatsTable stats={bySide(advanced.players, game.away.team.id)} />
              <PlayerAdvancedStatsTable stats={bySide(advanced.players, game.home.team.id)} />
            </Stack>
          )}
        </Stack>
      </Stack>
    </PageShell>
  );
}
