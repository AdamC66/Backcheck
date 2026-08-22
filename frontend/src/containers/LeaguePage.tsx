import { Link, Navigate, useParams } from "react-router";
import { PageShell } from "@/components/PageShell/PageShell";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { TeamCard } from "@/components/TeamCard/TeamCard";
import { Text } from "@/components/Text/Text";
import { UserMenu } from "@/containers/UserMenu";
import { useLeague } from "@/models/useLeague";

export function LeaguePage() {
  const { slug } = useParams();
  const league = useLeague(slug ?? "");

  if (slug === undefined) {
    return <Navigate to="/" replace />;
  }

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
    </PageShell>
  );
}
