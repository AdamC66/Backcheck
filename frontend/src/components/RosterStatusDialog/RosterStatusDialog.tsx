import { useState } from "react";
import { Button } from "@/components/Button/Button";
import { Dialog } from "@/components/Dialog/Dialog";
import { Row } from "@/components/Row/Row";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { Stack } from "@/components/Stack/Stack";
import { TextInput } from "@/components/TextInput/TextInput";
import { toIsoDate } from "@/lib/format";
import type { RosterEntry, RosterStatusValue } from "@/models/roster";

const STATUS_OPTIONS: { value: RosterStatusValue; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "injured_reserve", label: "Injured Reserve" },
  { value: "non_roster", label: "Non-Roster" },
];

export interface RosterStatusDialogProps {
  entry: RosterEntry;
  onCancel: () => void;
  onConfirm: (status: RosterStatusValue, effectiveOn: string) => void;
}

export function RosterStatusDialog({ entry, onCancel, onConfirm }: RosterStatusDialogProps) {
  const [status, setStatus] = useState<RosterStatusValue>(entry.roster_status.status);
  const [effectiveOn, setEffectiveOn] = useState(() => toIsoDate(new Date()));
  const fullName = `${entry.player.first_name} ${entry.player.last_name}`;
  const changed = status !== entry.roster_status.status;

  return (
    <Dialog open onClose={onCancel} title={`Roster status — ${fullName}`}>
      <Stack gap="md">
        <SegmentedControl
          label="New status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
        />

        {changed ? (
          <TextInput
            id="roster-status-effective-on"
            label={status === "active" ? "Active as of" : "In effect as of"}
            type="date"
            max={toIsoDate(new Date())}
            value={effectiveOn}
            onChange={(event) => setEffectiveOn(event.target.value)}
          />
        ) : null}

        <Row justify="end" gap="sm">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onConfirm(status, effectiveOn)} disabled={!changed}>
            Confirm
          </Button>
        </Row>
      </Stack>
    </Dialog>
  );
}
