import { Outlet, useParams } from "react-router";
import { GameHeader } from "@/components/GameHeader/GameHeader";
import { PageShell } from "@/components/PageShell/PageShell";
import { Stack } from "@/components/Stack/Stack";
import { TabNav } from "@/components/TabNav/TabNav";
import { TeamTheme } from "@/components/TeamTheme/TeamTheme";
import { Text } from "@/components/Text/Text";
import { UserMenu } from "@/containers/UserMenu";
import type { GameContext } from "@/containers/GamePage/gameContext";
import { useGameDetail } from "@/models/useGameDetail";

const TABS = [
  { label: "Gamesheet", to: "", end: true },
  { label: "Stats", to: "stats" },
  { label: "Advanced", to: "advanced" },
  { label: "Charts", to: "charts" },
];

export function GamePage() {
  const { id } = useParams();
  const gameId = id === undefined ? null : Number(id);
  const detail = useGameDetail(gameId);

  if (detail.isPending) {
    return (
      <PageShell actions={<UserMenu />}>
        <Text tone="muted">Loading game…</Text>
      </PageShell>
    );
  }

  if (detail.isError) {
    return (
      <PageShell actions={<UserMenu />}>
        <Text tone="danger">Could not load this game.</Text>
      </PageShell>
    );
  }

  const gameDetail = detail.data.data;
  const context: GameContext = {
    detail: gameDetail,
    statsSyncing: detail.data.meta?.stats_syncing === true,
  };

  return (
    <PageShell actions={<UserMenu />} width="wide">
      <TeamTheme team={gameDetail.game.home.team}>
        <Stack gap="lg">
          <Stack gap="sm">
            <GameHeader game={gameDetail.game} statsSyncing={context.statsSyncing} />
            <div className="flex flex-col">
              <div className="h-1 bg-team-trim" />
              <div className="h-2 bg-team-secondary" />
              <div className="h-1 bg-team-trim" />
            </div>
            <TabNav items={TABS} label="Game sections" />
          </Stack>

          <Outlet context={context} />
        </Stack>
      </TeamTheme>
    </PageShell>
  );
}
