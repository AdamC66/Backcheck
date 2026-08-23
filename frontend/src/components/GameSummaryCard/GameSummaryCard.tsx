import { Card } from "@/components/Card/Card";
import { GameRow } from "@/components/GameRow/GameRow";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import type { TeamGame } from "@/lib/teamSchedule";

export interface GameSummaryCardProps {
  title: string;
  games: TeamGame[];
  emptyLabel: string;
}

export function GameSummaryCard({ title, games, emptyLabel }: GameSummaryCardProps) {
  return (
    <Stack gap="xs" className="min-w-0 flex-1">
      <Text variant="label">{title}</Text>

      <Card padding="none">
        {games.length === 0 ? (
          <Text tone="muted" className="block px-3 py-4 text-sm">
            {emptyLabel}
          </Text>
        ) : (
          <ul>
            {games.map((entry) => (
              <GameRow key={entry.game.id} entry={entry} />
            ))}
          </ul>
        )}
      </Card>
    </Stack>
  );
}
