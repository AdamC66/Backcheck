import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { GameTicker } from "@/components/GameTicker/GameTicker";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { TeamCard } from "@/components/TeamCard/TeamCard";
import { Text } from "@/components/Text/Text";
import { ApiError } from "@/lib/apiClient";
import { groupByDate } from "@/lib/gameDays";
import { useLeague } from "@/models/useLeague";
import { useLeagueGames } from "@/models/useLeagueGames";

export function LeagueOverviewPage() {
  const { slug } = useParams();
  const league = useLeague(slug ?? "");
  const games = useLeagueGames(slug ?? "");

  // Stable identity: the ticker keys a layout effect off this array.
  const pages = games.data?.pages;
  const days = useMemo(() => groupByDate(pages?.flatMap((page) => page.data) ?? []), [pages]);

  const gamesMissing = games.error instanceof ApiError && games.error.status === 404;
  const teams = league.data?.teams ?? [];

  return (
    <Stack gap="lg">
      {/* Rendered even while loading: the strip holds its height, so the page below
          doesn't jump once games arrive. */}
      {gamesMissing ? null : (
        <GameTicker
          days={days}
          isLoading={games.isPending}
          hasEarlier={games.hasPreviousPage}
          hasLater={games.hasNextPage}
          onReachStart={() => {
            if (!games.isFetching) games.fetchPreviousPage();
          }}
          onReachEnd={() => {
            if (!games.isFetching) games.fetchNextPage();
          }}
        />
      )}

      <Stack gap="sm">
        <Row justify="between" align="baseline">
          <Text variant="subheading">Teams</Text>
          {teams.length === 0 ? null : <Text variant="caption">{teams.length}</Text>}
        </Row>

        {league.isPending ? <Text tone="muted">Loading teams…</Text> : null}
        {league.isSuccess && teams.length === 0 ? (
          <Text tone="muted">This league has no teams yet.</Text>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              <TeamCard team={team} />
            </Link>
          ))}
        </div>
      </Stack>
    </Stack>
  );
}
