import { useParams } from "react-router";
import { Row } from "@/components/Row/Row";
import { RosterList } from "@/components/RosterList/RosterList";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { groupRosterByPosition } from "@/lib/roster";
import { useTeamRoster } from "@/models/useTeamRoster";

// A valid :id is guaranteed by TeamPage, which redirects before this ever renders.
export function TeamRosterPage() {
  const { id } = useParams();
  const teamId = Number(id);

  const roster = useTeamRoster(teamId);

  if (roster.isPending) {
    return <Text tone="muted">Loading roster…</Text>;
  }

  if (roster.isError) {
    return <Text tone="danger">Could not load this team's roster.</Text>;
  }

  const groups = groupRosterByPosition(roster.data.data);

  return (
    <Stack gap="sm">
      <Row justify="between" align="baseline">
        <Text variant="subheading">Roster</Text>
        <Text variant="caption">
          {roster.data.meta?.season} · {roster.data.data.length} players
        </Text>
      </Row>

      {groups.length === 0 ? (
        <Text tone="muted">No roster recorded for this season yet.</Text>
      ) : (
        <RosterList groups={groups} />
      )}
    </Stack>
  );
}
