import { useParams } from "react-router";
import { GameSummaryCard } from "@/components/GameSummaryCard/GameSummaryCard";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { formatGameDateTime } from "@/lib/format";
import { recentTeamGames, upcomingTeamGames } from "@/lib/teamSchedule";
import { pointsTile, recordTile, streakTile, type KpiTile } from "@/lib/teamKpis";
import { useStandings } from "@/models/useStandings";
import { useTeam } from "@/models/useTeam";
import { useTeamGames } from "@/models/useTeamGames";

function KpiCard({ tile, hero = false }: { tile: KpiTile; hero?: boolean }) {
  return (
    <div
      className={
        hero ? "bg-team-primary p-5 text-team-contrast" : "border border-slate-200 bg-white p-5"
      }
    >
      <Text
        variant="caption"
        className={`block font-bold tracking-widest uppercase ${hero ? "text-team-contrast/60" : "text-slate-400"}`}
      >
        {tile.label}
      </Text>
      <div className={`font-display text-3xl font-semibold ${hero ? "" : "text-slate-900"}`}>
        {tile.value}
      </div>
      {tile.detail === null ? null : (
        <Text
          variant="caption"
          className={`block font-bold ${hero ? "text-team-contrast/70" : "text-slate-400"}`}
        >
          {tile.detail}
        </Text>
      )}
    </div>
  );
}

// A valid :id is guaranteed by TeamPage, which redirects before this ever renders.
export function TeamOverviewPage() {
  const { id } = useParams();
  const teamId = Number(id);

  const team = useTeam(teamId);
  const games = useTeamGames(teamId);
  const standings = useStandings(team.data?.league?.slug ?? "");

  if (games.isPending || team.isPending) {
    return <Text tone="muted">Loading…</Text>;
  }

  if (games.isError || team.isError) {
    return <Text tone="danger">Could not load this team's games.</Text>;
  }

  const allGames = games.data.data;
  const standing = standings.data?.data.find((row) => row.team.id === teamId);
  const upcoming = upcomingTeamGames(allGames, teamId);
  const nextGame = upcoming[0];

  const nextGameTile: KpiTile = {
    label: "Next Game",
    value:
      nextGame === undefined ? "—" : `${nextGame.isHome ? "vs." : "@"} ${nextGame.opponent.name}`,
    detail: nextGame === undefined ? null : formatGameDateTime(nextGame.game.starts_at),
  };

  return (
    <Stack gap="lg">
      <Row justify="between" align="baseline">
        <Text variant="heading" className="font-display tracking-wide">
          Overview
        </Text>
        {standings.data?.meta === undefined ? null : (
          <Text variant="caption" className="font-bold tracking-wide text-slate-400 uppercase">
            {standings.data.meta.season} season
          </Text>
        )}
      </Row>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard tile={recordTile(standing)} hero />
        <KpiCard tile={pointsTile(standing)} />
        <KpiCard tile={streakTile(standing)} />
        <KpiCard tile={nextGameTile} />
      </div>

      <div className="flex flex-col items-stretch gap-5 sm:flex-row sm:items-start">
        <GameSummaryCard
          title="Last 3 games"
          games={recentTeamGames(allGames, teamId)}
          emptyLabel="No recent games."
        />
        <GameSummaryCard title="Next 3 games" games={upcoming} emptyLabel="No games scheduled." />
      </div>
    </Stack>
  );
}
