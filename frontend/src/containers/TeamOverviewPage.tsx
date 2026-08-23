import { useParams } from "react-router";
import { GameSummaryCard } from "@/components/GameSummaryCard/GameSummaryCard";
import { Row } from "@/components/Row/Row";
import { Text } from "@/components/Text/Text";
import { recentTeamGames, upcomingTeamGames } from "@/lib/teamSchedule";
import { useTeamGames } from "@/models/useTeamGames";

// A valid :id is guaranteed by TeamPage, which redirects before this ever renders.
export function TeamOverviewPage() {
  const { id } = useParams();
  const teamId = Number(id);

  const games = useTeamGames(teamId);

  if (games.isPending) {
    return <Text tone="muted">Loading…</Text>;
  }

  if (games.isError) {
    return <Text tone="danger">Could not load this team's games.</Text>;
  }

  const allGames = games.data.data;

  return (
    <Row gap="lg" align="start" wrap>
      <GameSummaryCard
        title="Last 3 games"
        games={recentTeamGames(allGames, teamId)}
        emptyLabel="No recent games."
      />
      <GameSummaryCard
        title="Next 3 games"
        games={upcomingTeamGames(allGames, teamId)}
        emptyLabel="No games scheduled."
      />
    </Row>
  );
}
