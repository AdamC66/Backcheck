import { useParams, useSearchParams } from "react-router";
import { Row } from "@/components/Row/Row";
import { ScheduleList } from "@/components/ScheduleList/ScheduleList";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { Select } from "@/components/Select/Select";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { groupByMonth } from "@/lib/teamSchedule";
import type { GameType } from "@/models/games";
import { useSeasons } from "@/models/useSeasons";
import { useTeam } from "@/models/useTeam";
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
  const team = useTeam(teamId);
  const seasons = useSeasons(team.data?.league?.slug ?? null);
  const games = useTeamGames(teamId, {
    season: searchParams.get("season") ?? undefined,
    gameType: type === "all" ? undefined : (type as GameType),
  });
  const resolvedSeason = games.data?.meta?.season;

  function patchParams(next: Record<string, string | null>) {
    const merged = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === null) merged.delete(key);
      else merged.set(key, value);
    }
    setSearchParams(merged, { replace: true });
  }

  const months = groupByMonth(games.data?.data ?? [], teamId);

  return (
    <Stack gap="sm">
      <Row justify="between" align="baseline">
        <Text variant="heading" className="font-display tracking-wide">
          Schedule
        </Text>
        {games.data === undefined ? null : (
          <Text variant="caption" className="font-bold tracking-wide text-slate-400 uppercase">
            {games.data.meta?.count} games
          </Text>
        )}
      </Row>

      <Row gap="sm" wrap align="end">
        {seasons.data && seasons.data.length > 0 ? (
          <Select
            id="schedule-season"
            label="Season"
            value={resolvedSeason ?? ""}
            onChange={(event) => patchParams({ season: event.target.value })}
            options={seasons.data.map((season) => ({ value: season.label, label: season.label }))}
            className="max-w-40"
          />
        ) : null}

        <SegmentedControl
          options={TYPE_OPTIONS}
          value={type}
          onChange={(next) => patchParams({ type: next === "all" ? null : next })}
          label="Game type"
          themed
        />
      </Row>

      {games.isPending ? <Text tone="muted">Loading schedule…</Text> : null}
      {games.isError ? <Text tone="danger">Could not load this schedule.</Text> : null}
      {games.isSuccess && months.length === 0 ? (
        <Text tone="muted">No games recorded for this season yet.</Text>
      ) : null}

      <ScheduleList months={months} />
    </Stack>
  );
}
