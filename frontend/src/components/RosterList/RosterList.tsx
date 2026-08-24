import { useState } from "react";
import { Card } from "@/components/Card/Card";
import { PlayerRow } from "@/components/PlayerRow/PlayerRow";
import { RosterStatusDialog } from "@/components/RosterStatusDialog/RosterStatusDialog";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import type { RosterEntry, RosterStatusValue } from "@/models/roster";

export interface RosterListSection {
  key: string;
  label: string | null;
  entries: RosterEntry[];
}

export interface RosterListProps {
  sections: RosterListSection[];
  canManageRoster: boolean;
  onSetStatus: (playerId: number, status: RosterStatusValue, effectiveOn: string) => void;
}

function RosterSectionCard({
  section,
  canManageRoster,
  onManageStatus,
}: {
  section: RosterListSection;
  canManageRoster: boolean;
  onManageStatus: (entry: RosterEntry) => void;
}) {
  if (section.entries.length === 0) return null;

  return (
    <Stack gap="xs">
      {section.label === null ? null : (
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-1 bg-team-accent" />
          <Text variant="label" className="font-display uppercase tracking-wide">
            {section.label}
          </Text>
        </span>
      )}

      <Card padding="none">
        <ul>
          {section.entries.map((entry) => (
            <PlayerRow
              key={entry.player.id}
              entry={entry}
              canManageRoster={canManageRoster}
              onManageStatus={onManageStatus}
            />
          ))}
        </ul>
      </Card>
    </Stack>
  );
}

export function RosterList({ sections, canManageRoster, onSetStatus }: RosterListProps) {
  const [managingEntry, setManagingEntry] = useState<RosterEntry | null>(null);

  return (
    <Stack gap="md">
      {sections.map((section) => (
        <RosterSectionCard
          key={section.key}
          section={section}
          canManageRoster={canManageRoster}
          onManageStatus={setManagingEntry}
        />
      ))}

      {managingEntry === null ? null : (
        <RosterStatusDialog
          entry={managingEntry}
          onCancel={() => setManagingEntry(null)}
          onConfirm={(status, effectiveOn) => {
            onSetStatus(managingEntry.player.id, status, effectiveOn);
            setManagingEntry(null);
          }}
        />
      )}
    </Stack>
  );
}
