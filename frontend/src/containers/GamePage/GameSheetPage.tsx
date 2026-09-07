import { GameGoalieDecisionLine } from "@/components/GameGoalieDecisionLine/GameGoalieDecisionLine";
import { GameGoalSummary } from "@/components/GameGoalSummary/GameGoalSummary";
import { GamePenaltyList } from "@/components/GamePenaltyList/GamePenaltyList";
import { GamePeriodScoreTable } from "@/components/GamePeriodScoreTable/GamePeriodScoreTable";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { useGameContext } from "@/containers/GamePage/gameContext";

function count(n: number, singular: string, plural: string): string | undefined {
  return n === 0 ? undefined : `${n} ${n === 1 ? singular : plural}`;
}

export function GameSheetPage() {
  const { detail } = useGameContext();
  const { game, goals, penalties, goalies, period_summary: periodSummary } = detail;

  const teamAbbrevById: Record<number, string> = {
    [game.away.team.id]: game.away.team.abbreviation,
    [game.home.team.id]: game.home.team.abbreviation,
  };

  return (
    <Stack gap="lg">
      <Stack gap="sm">
        <SectionHeading>Scoring by Period</SectionHeading>
        {periodSummary.periods.length === 0 ? (
          <Text tone="muted">No scoring data for this game yet.</Text>
        ) : (
          <div className="overflow-x-auto">
            <GamePeriodScoreTable
              summary={periodSummary}
              awayLabel={game.away.team.abbreviation}
              homeLabel={game.home.team.abbreviation}
            />
          </div>
        )}
      </Stack>

      <Stack gap="sm">
        <SectionHeading aside={count(goals.length, "goal", "goals")}>Goal Summary</SectionHeading>
        <GameGoalSummary goals={goals} teamAbbrevById={teamAbbrevById} />
      </Stack>

      <Stack gap="sm">
        <SectionHeading aside={count(penalties.length, "penalty", "penalties")}>
          Penalties
        </SectionHeading>
        <GamePenaltyList penalties={penalties} teamAbbrevById={teamAbbrevById} />
      </Stack>

      <Stack gap="sm">
        <SectionHeading>Goaltending</SectionHeading>
        {goalies.length === 0 ? (
          <Text tone="muted">No goalie stats recorded for this game yet.</Text>
        ) : (
          <GameGoalieDecisionLine goalies={goalies} />
        )}
      </Stack>
    </Stack>
  );
}
