import { useSearchParams } from "react-router";
import { GameGoalieStatsTable } from "@/components/GameGoalieStatsTable/GameGoalieStatsTable";
import { GameSkaterStatsTable } from "@/components/GameSkaterStatsTable/GameSkaterStatsTable";
import { Row } from "@/components/Row/Row";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { Stack } from "@/components/Stack/Stack";
import { TeamSideToggle, type GameSideKey } from "@/components/TeamSideToggle/TeamSideToggle";
import { TeamTheme } from "@/components/TeamTheme/TeamTheme";
import { Text } from "@/components/Text/Text";
import { bySide, useGameContext } from "@/containers/GamePage/gameContext";

export function GameStatsPage() {
  const { detail } = useGameContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const { game, skaters, goalies } = detail;

  const sideKey: GameSideKey = searchParams.get("team") === "home" ? "home" : "away";
  const side = game[sideKey];
  const teamSkaters = bySide(skaters, side.team.id);
  const teamGoalies = bySide(goalies, side.team.id);

  function selectSide(next: GameSideKey) {
    setSearchParams(next === "away" ? {} : { team: next }, { replace: true });
  }

  return (
    <Stack gap="lg">
      <Row justify="between" align="baseline" wrap>
        <Text variant="heading" className="font-display tracking-wide">
          Box Score
        </Text>
        <TeamSideToggle
          away={game.away.team}
          home={game.home.team}
          value={sideKey}
          onChange={selectSide}
        />
      </Row>

      <TeamTheme team={side.team}>
        <Stack gap="lg">
          <Stack gap="sm">
            <SectionHeading>{side.team.name} — Skaters</SectionHeading>
            {teamSkaters.length === 0 ? (
              <Text tone="muted">No skater stats recorded for this team yet.</Text>
            ) : (
              <GameSkaterStatsTable stats={teamSkaters} />
            )}
          </Stack>

          <Stack gap="sm">
            <SectionHeading>{side.team.name} — Goaltenders</SectionHeading>
            {teamGoalies.length === 0 ? (
              <Text tone="muted">No goalie stats recorded for this team yet.</Text>
            ) : (
              <GameGoalieStatsTable stats={teamGoalies} />
            )}
          </Stack>
        </Stack>
      </TeamTheme>
    </Stack>
  );
}
