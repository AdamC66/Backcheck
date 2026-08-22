import { Card } from "@/components/Card/Card";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import type { League } from "@/models/leagues";

export interface LeagueCardProps {
  league: League;
}

export function LeagueCard({ league }: LeagueCardProps) {
  return (
    <Card>
      <Row gap="md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center">
          {league.logo_url === null ? (
            <Text variant="label">{league.abbreviation}</Text>
          ) : (
            <img
              src={league.logo_url}
              alt={`${league.name} logo`}
              className="max-h-12 max-w-12 object-contain"
            />
          )}
        </div>

        <Stack gap="none">
          <Text variant="subheading">{league.abbreviation}</Text>
          <Text variant="caption">{league.name}</Text>
        </Stack>
      </Row>
    </Card>
  );
}
