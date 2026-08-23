import { Card } from "@/components/Card/Card";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { TeamTheme } from "@/components/TeamTheme/TeamTheme";
import { Text } from "@/components/Text/Text";
import type { Team } from "@/models/teams";

export interface TeamCardProps {
  team: Team;
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <TeamTheme team={team}>
      <Card padding="none" className="overflow-hidden">
        <Row gap="none" align="stretch">
          <div className="w-1.5 shrink-0 bg-team-primary" />

          <Row gap="md" className="min-w-0 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              {team.logo_url === null ? (
                <Text variant="label">{team.abbreviation}</Text>
              ) : (
                <img
                  src={team.logo_url}
                  alt={`${team.name} logo`}
                  className="max-h-10 max-w-10 object-contain"
                />
              )}
            </div>

            <Stack gap="none" className="min-w-0">
              <Text variant="label" className="block truncate">
                {team.name}
              </Text>
              <Text variant="caption">{team.abbreviation}</Text>
            </Stack>
          </Row>
        </Row>
      </Card>
    </TeamTheme>
  );
}
