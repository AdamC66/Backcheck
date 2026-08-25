import { useState } from "react";
import { Card } from "@/components/Card/Card";
import { CallUpDialog } from "@/components/CallUpDialog/CallUpDialog";
import { PlayerRow } from "@/components/PlayerRow/PlayerRow";
import { RosterStatusDialog } from "@/components/RosterStatusDialog/RosterStatusDialog";
import { SendDownDialog } from "@/components/SendDownDialog/SendDownDialog";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import type { RosterEntry, RosterStatusValue } from "@/models/roster";
import type { Team } from "@/models/teams";

export interface RosterListSection {
  key: string;
  label: string | null;
  entries: RosterEntry[];
}

export interface RosterListProps {
  sections: RosterListSection[];
  canManageRoster: boolean;
  affiliateTeams: Team[];
  onSetStatus: (playerId: number, status: RosterStatusValue, effectiveOn: string) => void;
  onSendDown: (playerId: number, destinationTeamId: number) => void;
  onCallUp: (playerId: number) => void;
}

function RosterSectionCard({
  section,
  canManageRoster,
  canSendDown,
  onManageStatus,
  onSendDown,
  onCallUp,
}: {
  section: RosterListSection;
  canManageRoster: boolean;
  canSendDown: boolean;
  onManageStatus: (entry: RosterEntry) => void;
  onSendDown: (entry: RosterEntry) => void;
  onCallUp: (entry: RosterEntry) => void;
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
              canSendDown={canSendDown}
              onSendDown={onSendDown}
              onCallUp={onCallUp}
            />
          ))}
        </ul>
      </Card>
    </Stack>
  );
}

export function RosterList({
  sections,
  canManageRoster,
  affiliateTeams,
  onSetStatus,
  onSendDown,
  onCallUp,
}: RosterListProps) {
  const [managingEntry, setManagingEntry] = useState<RosterEntry | null>(null);
  const [sendingDownEntry, setSendingDownEntry] = useState<RosterEntry | null>(null);
  const [callingUpEntry, setCallingUpEntry] = useState<RosterEntry | null>(null);
  const canSendDown = canManageRoster && affiliateTeams.length > 0;

  return (
    <Stack gap="md">
      {sections.map((section) => (
        <RosterSectionCard
          key={section.key}
          section={section}
          canManageRoster={canManageRoster}
          canSendDown={canSendDown}
          onManageStatus={setManagingEntry}
          onSendDown={setSendingDownEntry}
          onCallUp={setCallingUpEntry}
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

      {sendingDownEntry === null ? null : (
        <SendDownDialog
          entry={sendingDownEntry}
          affiliateTeams={affiliateTeams}
          onCancel={() => setSendingDownEntry(null)}
          onConfirm={(destinationTeamId) => {
            onSendDown(sendingDownEntry.player.id, destinationTeamId);
            setSendingDownEntry(null);
          }}
        />
      )}

      {callingUpEntry === null ? null : (
        <CallUpDialog
          entry={callingUpEntry}
          onCancel={() => setCallingUpEntry(null)}
          onConfirm={() => {
            onCallUp(callingUpEntry.player.id);
            setCallingUpEntry(null);
          }}
        />
      )}
    </Stack>
  );
}
