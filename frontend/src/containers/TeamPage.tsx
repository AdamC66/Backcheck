import { Link, Navigate, Outlet, useParams } from "react-router";
import { PageShell } from "@/components/PageShell/PageShell";
import { Row } from "@/components/Row/Row";
import { SideNav } from "@/components/SideNav/SideNav";
import { Stack } from "@/components/Stack/Stack";
import { TeamHeader } from "@/components/TeamHeader/TeamHeader";
import { TeamTheme } from "@/components/TeamTheme/TeamTheme";
import { Text } from "@/components/Text/Text";
import { UserMenu } from "@/containers/UserMenu";
import { useTeam } from "@/models/useTeam";

const NAV_ITEMS = [
  { label: "Overview", to: "", end: true },
  { label: "Schedule", to: "schedule" },
  { label: "Roster", to: "roster" },
];

export function TeamPage() {
  const { id } = useParams();
  const teamId = Number(id);
  const valid = Number.isInteger(teamId) && teamId > 0;

  const team = useTeam(valid ? teamId : null);
  const league = team.data?.league;

  if (!valid) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell actions={<UserMenu />}>
      <TeamTheme team={team.data}>
        <Stack gap="lg">
          <Stack gap="sm">
            <Link
              to={league === undefined ? "/" : `/leagues/${league.slug}`}
              className="w-fit text-sm text-slate-500 hover:text-slate-900"
            >
              ← {league?.name ?? "All leagues"}
            </Link>

            <TeamHeader team={team.data} />
          </Stack>

          {team.isError ? (
            <Text tone="danger">Could not load this team.</Text>
          ) : (
            <Row gap="lg" align="start">
              <SideNav items={NAV_ITEMS} label="Team sections" />

              <div className="min-w-0 flex-1">
                <Outlet />
              </div>
            </Row>
          )}
        </Stack>
      </TeamTheme>
    </PageShell>
  );
}
