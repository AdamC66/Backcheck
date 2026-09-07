import { Outlet } from "react-router";
import { AppSidebar } from "@/components/AppSidebar/AppSidebar";
import { PageShell } from "@/components/PageShell/PageShell";
import { Text } from "@/components/Text/Text";
import { UserMenu } from "@/containers/UserMenu";

const NAV_ITEMS = [
  { label: "Sync Runs", to: "", end: true },
  { label: "Data", to: "data" },
  { label: "Danger zones", to: "rink" },
  { label: "xG model", to: "xg-model" },
  { label: "How xG works", to: "xg-method" },
  { label: "Roadmap", to: "roadmap" },
];

export function AdminPage() {
  return (
    <PageShell actions={<UserMenu />} width="full">
      <div className="flex min-w-0 flex-1">
        <AppSidebar
          backTo="/"
          backLabel="Dashboard"
          navItems={NAV_ITEMS}
          navLabel="Admin sections"
          header={
            <div className="mb-5 px-2">
              <Text variant="label" className="text-lg tracking-wide text-team-contrast">
                Admin
              </Text>
            </div>
          }
        />

        <div className="min-w-0 flex-1 bg-slate-50 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <Outlet />
        </div>
      </div>
    </PageShell>
  );
}
