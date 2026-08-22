import { AppHeader } from "@/components/AppHeader/AppHeader";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { UserMenu } from "@/features/auth/UserMenu";
import { useAuth } from "@/features/auth/useAuth";

const PLACEHOLDER_SECTIONS = [
  { title: "Rosters", detail: "Player movement by season, once RosterEntry lands." },
  { title: "Games", detail: "Schedule, results, and computed rest/fatigue signals." },
  { title: "Stats", detail: "Skater and goalie stat lines, per game and per season." },
];

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader title="Backcheck" actions={<UserMenu />} />

      <main className="mx-auto max-w-6xl p-6">
        <Stack gap="lg">
          <Stack gap="xs">
            <Text variant="heading">Dashboard</Text>
            <Text tone="muted">Signed in as {user?.email}</Text>
          </Stack>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLACEHOLDER_SECTIONS.map((section) => (
              <div key={section.title} className="rounded-lg border border-slate-200 bg-white p-4">
                <Stack gap="xs">
                  <Text variant="subheading">{section.title}</Text>
                  <Text variant="caption">{section.detail}</Text>
                </Stack>
              </div>
            ))}
          </div>
        </Stack>
      </main>
    </div>
  );
}
