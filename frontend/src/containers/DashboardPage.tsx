import { Link } from "react-router";
import { LeagueCard } from "@/components/LeagueCard/LeagueCard";
import { PageShell } from "@/components/PageShell/PageShell";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { UserMenu } from "@/containers/UserMenu";
import { useAuth } from "@/auth/useAuth";
import { useLeagues } from "@/models/useLeagues";

export function DashboardPage() {
  const { user } = useAuth();
  const leagues = useLeagues();

  return (
    <PageShell actions={<UserMenu />}>
      <Stack gap="lg">
        <Stack gap="xs">
          <Text variant="heading">Dashboard</Text>
          <Text tone="muted">Signed in as {user?.email}</Text>
        </Stack>

        <Stack gap="sm">
          <Text variant="subheading">Leagues</Text>

          {leagues.isPending ? <Text tone="muted">Loading leagues…</Text> : null}
          {leagues.isError ? <Text tone="danger">Could not load leagues.</Text> : null}
          {leagues.data?.length === 0 ? (
            <Text tone="muted">You don&apos;t have access to any leagues yet.</Text>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leagues.data?.map((league) => (
              <Link
                key={league.id}
                to={`/leagues/${league.slug}`}
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                <LeagueCard league={league} />
              </Link>
            ))}
          </div>
        </Stack>
      </Stack>
    </PageShell>
  );
}
