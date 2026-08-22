import { Link, Navigate, useParams } from "react-router";
import { Card } from "@/components/Card/Card";
import { PageShell } from "@/components/PageShell/PageShell";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { StandingsTable } from "@/components/StandingsTable/StandingsTable";
import { TeamCard } from "@/components/TeamCard/TeamCard";
import { Text } from "@/components/Text/Text";
import { UserMenu } from "@/containers/UserMenu";
import { ApiError } from "@/lib/apiClient";
import { useLeague } from "@/models/useLeague";
import { useStandings } from "@/models/useStandings";

function formatAsOf(date: string | null | undefined) {
  if (date === null || date === undefined) {
    return null;
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function LeaguePage() {
  const { slug } = useParams();
  const league = useLeague(slug ?? "");
  const standings = useStandings(slug ?? "");

  if (slug === undefined) {
    return <Navigate to="/" replace />;
  }

  // A league with no ingested season answers 404, which is an absence rather than a
  // failure — the AHL and ECHL have teams but no standings yet.
  const standingsMissing = standings.error instanceof ApiError && standings.error.status === 404;
  const asOf = formatAsOf(standings.data?.meta?.as_of_date);

  return (
    <PageShell actions={<UserMenu />}>
      <Stack gap="lg">
        <Stack gap="sm">
          <Link to="/" className="w-fit text-sm text-slate-500 hover:text-slate-900">
            ← All leagues
          </Link>

          <Row gap="md">
            {league.data?.logo_url === undefined || league.data.logo_url === null ? null : (
              <img
                src={league.data.logo_url}
                alt={`${league.data.name} logo`}
                className="max-h-12 max-w-12 object-contain"
              />
            )}
            <Text variant="heading">{league.data?.name ?? "League"}</Text>
          </Row>
        </Stack>

        <Stack gap="sm">
          <Row justify="between" align="baseline">
            <Text variant="subheading">Standings</Text>
            {standings.data === undefined ? null : (
              <Text variant="caption">
                {standings.data.meta?.season}
                {asOf === null ? "" : ` · as of ${asOf}`}
              </Text>
            )}
          </Row>

          {standings.isPending ? <Text tone="muted">Loading standings…</Text> : null}
          {standingsMissing ? (
            <Text tone="muted">No standings have been collected for this league yet.</Text>
          ) : null}
          {standings.isError && !standingsMissing ? (
            <Text tone="danger">Could not load standings.</Text>
          ) : null}

          {standings.data === undefined ? null : (
            <Card padding="none">
              <StandingsTable standings={standings.data.data} />
            </Card>
          )}
        </Stack>

        <Stack gap="sm">
          <Text variant="subheading">Teams</Text>

          {league.isPending ? <Text tone="muted">Loading teams…</Text> : null}
          {league.isError ? <Text tone="danger">Could not load this league.</Text> : null}
          {league.data?.teams.length === 0 ? (
            <Text tone="muted">This league has no teams yet.</Text>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {league.data?.teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </Stack>
      </Stack>
    </PageShell>
  );
}
