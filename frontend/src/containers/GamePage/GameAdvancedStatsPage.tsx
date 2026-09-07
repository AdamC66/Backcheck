import { useSearchParams } from "react-router";
import { GameTeamAdvancedTable } from "@/components/GameTeamAdvancedTable/GameTeamAdvancedTable";
import { PlayerAdvancedStatsTable } from "@/components/PlayerAdvancedStatsTable/PlayerAdvancedStatsTable";
import { Row } from "@/components/Row/Row";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { Stack } from "@/components/Stack/Stack";
import { TeamSideToggle, type GameSideKey } from "@/components/TeamSideToggle/TeamSideToggle";
import { TeamTheme } from "@/components/TeamTheme/TeamTheme";
import { Text } from "@/components/Text/Text";
import { bySide, useGameContext } from "@/containers/GamePage/gameContext";

export function GameAdvancedStatsPage() {
  const { detail, statsSyncing } = useGameContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const { game, advanced } = detail;

  const sideKey: GameSideKey = searchParams.get("team") === "home" ? "home" : "away";
  const side = game[sideKey];
  const teamPlayers = bySide(advanced.players, side.team.id);

  function selectSide(next: GameSideKey) {
    setSearchParams(next === "away" ? {} : { team: next }, { replace: true });
  }

  if (advanced.teams.length === 0 && advanced.players.length === 0) {
    return (
      <Text tone="muted">
        No advanced stats recorded for this game yet{statsSyncing ? " — still syncing." : "."}
      </Text>
    );
  }

  return (
    <Stack gap="lg">
      <Stack gap="sm">
        <SectionHeading>Team Comparison</SectionHeading>
        <div className="overflow-x-auto">
          <GameTeamAdvancedTable
            awayLabel={game.away.team.abbreviation}
            homeLabel={game.home.team.abbreviation}
            away={advanced.teams.find((stat) => stat.team_id === game.away.team.id)}
            home={advanced.teams.find((stat) => stat.team_id === game.home.team.id)}
          />
        </div>
      </Stack>

      <Row justify="between" align="baseline" wrap>
        <Text variant="heading" className="font-display tracking-wide">
          Player Advanced Stats
        </Text>
        <TeamSideToggle
          away={game.away.team}
          home={game.home.team}
          value={sideKey}
          onChange={selectSide}
        />
      </Row>

      <TeamTheme team={side.team}>
        <Stack gap="sm">
          <SectionHeading>{side.team.name} — Skaters</SectionHeading>
          {teamPlayers.length === 0 ? (
            <Text tone="muted">No player advanced stats recorded for this team yet.</Text>
          ) : (
            <PlayerAdvancedStatsTable stats={teamPlayers} />
          )}
        </Stack>
      </TeamTheme>
    </Stack>
  );
}
