import { Button } from "@/components/Button/Button";
import { Dialog } from "@/components/Dialog/Dialog";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import type { RosterEntry } from "@/models/roster";

export interface CallUpDialogProps {
  entry: RosterEntry;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CallUpDialog({ entry, onCancel, onConfirm }: CallUpDialogProps) {
  const fullName = `${entry.player.first_name} ${entry.player.last_name}`;
  const from = entry.assignment?.team.name ?? "their affiliate";

  return (
    <Dialog open onClose={onCancel} title={`Call up — ${fullName}`}>
      <Stack gap="md">
        <Text tone="muted">
          Bring {fullName} back up from {from}?
        </Text>

        <Row justify="end" gap="sm">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            Confirm
          </Button>
        </Row>
      </Stack>
    </Dialog>
  );
}
