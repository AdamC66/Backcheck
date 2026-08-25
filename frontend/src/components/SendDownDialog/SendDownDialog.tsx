import { useState } from "react";
import { Button } from "@/components/Button/Button";
import { Dialog } from "@/components/Dialog/Dialog";
import { Row } from "@/components/Row/Row";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { Stack } from "@/components/Stack/Stack";
import type { RosterEntry } from "@/models/roster";
import type { Team } from "@/models/teams";

export interface SendDownDialogProps {
  entry: RosterEntry;
  affiliateTeams: Team[];
  onCancel: () => void;
  onConfirm: (destinationTeamId: number) => void;
}

export function SendDownDialog({
  entry,
  affiliateTeams,
  onCancel,
  onConfirm,
}: SendDownDialogProps) {
  const [destinationTeamId, setDestinationTeamId] = useState(String(affiliateTeams[0]?.id ?? ""));
  const fullName = `${entry.player.first_name} ${entry.player.last_name}`;

  return (
    <Dialog open onClose={onCancel} title={`Send down — ${fullName}`}>
      <Stack gap="md">
        <SegmentedControl
          label="Destination"
          options={affiliateTeams.map((team) => ({
            value: String(team.id),
            label: team.abbreviation,
          }))}
          value={destinationTeamId}
          onChange={setDestinationTeamId}
        />

        <Row justify="end" gap="sm">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onConfirm(Number(destinationTeamId))}>
            Confirm
          </Button>
        </Row>
      </Stack>
    </Dialog>
  );
}
