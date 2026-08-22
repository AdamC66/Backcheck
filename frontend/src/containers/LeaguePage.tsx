import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { PageShell } from "@/components/PageShell/PageShell";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { StandingsPanel } from "@/components/StandingsPanel/StandingsPanel";
import { TeamRail } from "@/components/TeamRail/TeamRail";
import { Text } from "@/components/Text/Text";
import { UserMenu } from "@/containers/UserMenu";
import { ApiError } from "@/lib/apiClient";
import { isStandingsView, type StandingsView } from "@/lib/standingsViews";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const league = useLeague(slug ?? "");
  const standings = useStandings(slug ?? "");

  if (slug === undefined) {
    return <Navigate to="/" replace />;
  }

  const viewParam = searchParams.get("view");
  const view: StandingsView = isStandingsView(viewParam) ? viewParam : "league";

  function selectView(next: StandingsView) {
    setSearchParams(next === "league" ? {} : { view: next }, { replace: true });
  }

  const standingsMissing = standings.error instanceof ApiError && standings.error.status === 404;
  const asOf = formatAsOf(standings.data?.meta?.as_of_date);
  const teams = league.data?.teams ?? [];

  return (
    <PageShell actions={<UserMenu />} width="wide">
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

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <section className="min-w-0 lg:sticky lg:top-6 lg:order-2">
            <Stack gap="sm">
              <Row justify="between" align="baseline">
                <Text variant="subheading">Teams</Text>
                {teams.length === 0 ? null : <Text variant="caption">{teams.length}</Text>}
              </Row>

              {league.isPending ? <Text tone="muted">Loading teams…</Text> : null}
              {league.isError ? <Text tone="danger">Could not load this league.</Text> : null}
              {league.isSuccess && teams.length === 0 ? (
                <Text tone="muted">This league has no teams yet.</Text>
              ) : null}

              <TeamRail teams={teams} />
            </Stack>
          </section>

          {/* min-w-0: without it the table widens the column instead of scrolling. */}
          <section className="min-w-0 lg:sticky lg:top-6 lg:order-1 lg:col-span-2">
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
                <StandingsPanel
                  standings={standings.data.data}
                  view={view}
                  onViewChange={selectView}
                />
              )}
            </Stack>
          </section>
        </div>
      </Stack>
    </PageShell>
  );
}
