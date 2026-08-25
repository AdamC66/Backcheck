import { useParams } from "react-router";
import { GoalieStatsTable } from "@/components/GoalieStatsTable/GoalieStatsTable";
import { Row } from "@/components/Row/Row";
import { SkaterStatsTable } from "@/components/SkaterStatsTable/SkaterStatsTable";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { useTeamStats } from "@/models/useTeamStats";

// A valid :id is guaranteed by TeamPage, which redirects before this ever renders.
export function TeamStatsPage() {
  const { id } = useParams();
  const teamId = Number(id);

  const stats = useTeamStats(teamId);

  if (stats.isPending) {
    return <Text tone="muted">Loading stats…</Text>;
  }

  if (stats.isError) {
    return <Text tone="danger">Could not load this team's stats.</Text>;
  }

  const { skaters, goalies } = stats.data.data;

  return (
    <Stack gap="lg">
      <Row justify="between" align="baseline">
        <Text variant="heading" className="font-display tracking-wide">
          Stats
        </Text>
        {stats.data.meta === undefined ? null : (
          <Text variant="caption" className="font-bold tracking-wide text-slate-400 uppercase">
            {stats.data.meta.season} · regular season
          </Text>
        )}
      </Row>

      {skaters.length === 0 && goalies.length === 0 ? (
        <Text tone="muted">No stats recorded for this season yet.</Text>
      ) : (
        <Stack gap="lg">
          <Stack gap="sm">
            <Text variant="label" className="font-bold tracking-wide text-slate-500 uppercase">
              Skaters
            </Text>
            {skaters.length === 0 ? (
              <Text tone="muted">No skater stats recorded for this season yet.</Text>
            ) : (
              <SkaterStatsTable stats={skaters} />
            )}
          </Stack>

          <Stack gap="sm">
            <Text variant="label" className="font-bold tracking-wide text-slate-500 uppercase">
              Goalies
            </Text>
            {goalies.length === 0 ? (
              <Text tone="muted">No goalie stats recorded for this season yet.</Text>
            ) : (
              <GoalieStatsTable stats={goalies} />
            )}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
