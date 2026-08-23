import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { PageShell } from "@/components/PageShell/PageShell";
import { Row } from "@/components/Row/Row";
import { ScheduleList } from "@/components/ScheduleList/ScheduleList";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { Stack } from "@/components/Stack/Stack";
import { TeamHeader } from "@/components/TeamHeader/TeamHeader";
import { TeamTheme } from "@/components/TeamTheme/TeamTheme";
import { Text } from "@/components/Text/Text";
import { UserMenu } from "@/containers/UserMenu";
import { groupByMonth } from "@/lib/teamSchedule";
import type { GameType } from "@/models/games";
import { useTeam } from "@/models/useTeam";
import { useTeamGames } from "@/models/useTeamGames";

const TYPE_OPTIONS = [
  { value: "all", label: "All games" },
  { value: "regular_season", label: "Regular season" },
];

export function TeamPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const teamId = Number(id);
  const valid = Number.isInteger(teamId) && teamId > 0;

  const type = searchParams.get("type") === "regular_season" ? "regular_season" : "all";
  const team = useTeam(valid ? teamId : null);
  const games = useTeamGames(valid ? teamId : null, {
    gameType: type === "all" ? undefined : (type as GameType),
  });

  if (!valid) {
    return <Navigate to="/" replace />;
  }

  function selectType(next: string) {
    setSearchParams(next === "all" ? {} : { type: next }, { replace: true });
  }

  const months = groupByMonth(games.data?.data ?? [], teamId);
  const season = games.data?.meta?.season;
  const league = team.data?.league;

  return (
    <PageShell actions={<UserMenu />}>
      <TeamTheme team={team.data}>
        <Stack gap="lg">
          <Stack gap="sm">
            <Link
              to={league === undefined ? "/" : `/leagues/${league.slug}`}
              className="w-fit text-sm text-slate-500 hover:text-slate-900"
            >
              ← {league?.name ?? "All leagues"}
            </Link>

            <TeamHeader
              team={team.data}
              subtitle={season === undefined ? undefined : `${season} season`}
            />
          </Stack>

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

            {team.isError ? <Text tone="danger">Could not load this team.</Text> : null}
            {games.isPending ? <Text tone="muted">Loading schedule…</Text> : null}
            {games.isError && !team.isError ? (
              <Text tone="danger">Could not load this schedule.</Text>
            ) : null}
            {games.isSuccess && months.length === 0 ? (
              <Text tone="muted">No games recorded for this season yet.</Text>
            ) : null}

            <ScheduleList months={months} />
          </Stack>
        </Stack>
      </TeamTheme>
    </PageShell>
  );
}
