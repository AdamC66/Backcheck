import { useParams, useSearchParams } from "react-router";
import { Row } from "@/components/Row/Row";
import { ScheduleList } from "@/components/ScheduleList/ScheduleList";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { groupByMonth } from "@/lib/teamSchedule";
import type { GameType } from "@/models/games";
import { useTeamGames } from "@/models/useTeamGames";

const TYPE_OPTIONS = [
  { value: "all", label: "All games" },
  { value: "regular_season", label: "Regular season" },
];

// A valid :id is guaranteed by TeamPage, which redirects before this ever renders.
export function TeamSchedulePage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const teamId = Number(id);

  const type = searchParams.get("type") === "regular_season" ? "regular_season" : "all";
  const games = useTeamGames(teamId, {
    gameType: type === "all" ? undefined : (type as GameType),
  });

  function selectType(next: string) {
    setSearchParams(next === "all" ? {} : { type: next }, { replace: true });
  }

  const months = groupByMonth(games.data?.data ?? [], teamId);

  return (
    <Stack gap="sm">
      <Row justify="between" align="baseline">
        <Text variant="subheading">Schedule</Text>
        {games.data === undefined ? null : (
          <Text variant="caption">{games.data.meta?.count} games</Text>
        )}
      </Row>

      <SegmentedControl
        options={TYPE_OPTIONS}
        value={type}
        onChange={selectType}
        label="Game type"
        themed
      />

      {games.isPending ? <Text tone="muted">Loading schedule…</Text> : null}
      {games.isError ? <Text tone="danger">Could not load this schedule.</Text> : null}
      {games.isSuccess && months.length === 0 ? (
        <Text tone="muted">No games recorded for this season yet.</Text>
      ) : null}

      <ScheduleList months={months} />
    </Stack>
  );
}
