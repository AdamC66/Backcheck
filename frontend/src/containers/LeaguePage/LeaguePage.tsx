import { Navigate, Outlet, useParams } from "react-router";
import { AppSidebar } from "@/components/AppSidebar/AppSidebar";
import { SidebarBrand } from "@/components/AppSidebar/SidebarBrand";
import { PageShell } from "@/components/PageShell/PageShell";
import { Text } from "@/components/Text/Text";
import { UserMenu } from "@/containers/UserMenu";
import { useLeague } from "@/models/useLeague";

const NAV_ITEMS = [
  { label: "Overview", to: "", end: true },
  { label: "Standings", to: "standings" },
  { label: "Stats", to: "stats" },
];

export function LeaguePage() {
  const { slug } = useParams();
  const league = useLeague(slug ?? "");

  if (slug === undefined) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell actions={<UserMenu />} width="full">
      <div className="flex min-w-0 flex-1">
        <AppSidebar
          backTo="/"
          backLabel="All leagues"
          navItems={NAV_ITEMS}
          navLabel="League sections"
          header={
            <SidebarBrand
              name={league.data?.name ?? "League"}
              logoUrl={league.data?.logo_url}
              fallback={league.data?.abbreviation}
            />
          }
        />

        <div className="min-w-0 flex-1 bg-slate-50 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          {league.isError ? <Text tone="danger">Could not load this league.</Text> : <Outlet />}
        </div>
      </div>
    </PageShell>
  );
}
