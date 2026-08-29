import { Navigate, Outlet, useParams } from "react-router";
import { AppSidebar } from "@/components/AppSidebar/AppSidebar";
import { SidebarBrand } from "@/components/AppSidebar/SidebarBrand";
import { PageShell } from "@/components/PageShell/PageShell";
import { Row } from "@/components/Row/Row";
import { TeamTheme } from "@/components/TeamTheme/TeamTheme";
import { Text } from "@/components/Text/Text";
import { ResyncTeamMenu } from "@/containers/TeamPage/ResyncTeamMenu";
import { UserMenu } from "@/containers/UserMenu";
import { useTeam } from "@/models/useTeam";

const NAV_ITEMS = [
  { label: "Overview", to: "", end: true },
  { label: "Schedule", to: "schedule" },
  { label: "Roster", to: "roster" },
  { label: "Stats", to: "stats" },
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

  if (team.isError) {
    return (
      <PageShell actions={<UserMenu />}>
        <Text tone="danger">Could not load this team.</Text>
      </PageShell>
    );
  }

  return (
    <PageShell
      actions={
        <Row gap="sm">
          <ResyncTeamMenu teamId={teamId} league={league} />
          <UserMenu />
        </Row>
      }
      width="full"
    >
      <TeamTheme team={team.data} className="flex min-w-0 flex-1">
        <AppSidebar
          backTo={league === undefined ? "/" : `/leagues/${league.slug}`}
          backLabel={league?.name ?? "All leagues"}
          navItems={NAV_ITEMS}
          navLabel="Team sections"
          header={
            <SidebarBrand
              name={team.data?.name ?? "Team"}
              logoUrl={team.data?.logo_url}
              fallback={team.data?.abbreviation}
              subtitle={league?.abbreviation}
            />
          }
        />

        <div className="min-w-0 flex-1 bg-slate-50 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <Outlet />
        </div>
      </TeamTheme>
    </PageShell>
  );
}
