import { Card } from "@/components/Card/Card";
import { GameRow } from "@/components/GameRow/GameRow";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import type { GameMonth } from "@/lib/teamSchedule";

export interface ScheduleListProps {
  months: GameMonth[];
}

export function ScheduleList({ months }: ScheduleListProps) {
  return (
    <Stack gap="md">
      {months.map((month) => (
        <Stack key={month.key} gap="xs">
          <span className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-team-accent" />
            <Text variant="label">{month.label}</Text>
          </span>

          <Card padding="none">
            <ul>
              {month.games.map((entry) => (
                <GameRow key={entry.game.id} entry={entry} />
              ))}
            </ul>
          </Card>
        </Stack>
      ))}
    </Stack>
  );
}
