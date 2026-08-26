import { Outlet } from "react-router";
import { PageShell } from "@/components/PageShell/PageShell";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { UserMenu } from "@/containers/UserMenu";

export function AdminPage() {
  return (
    <PageShell actions={<UserMenu />}>
      <Stack gap="lg">
        <Text variant="heading">Admin</Text>
        <Outlet />
      </Stack>
    </PageShell>
  );
}
