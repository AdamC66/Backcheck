import { useState } from "react";
import { Button } from "@/components/Button/Button";
import { Dialog } from "@/components/Dialog/Dialog";
import { Row } from "@/components/Row/Row";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { MIN_INTERVAL_PRESET_OPTIONS, type MinIntervalPreset } from "@/models/adminSync";

export interface SyncCoverageDialogProps {
  open: boolean;
  onClose: () => void;
  kindLabel: string;
  scopeLabel: string;
  isPending: boolean;
  onConfirm: (preset: MinIntervalPreset) => void;
}

export function SyncCoverageDialog({
  open,
  onClose,
  kindLabel,
  scopeLabel,
  isPending,
  onConfirm,
}: SyncCoverageDialogProps) {
  const [preset, setPreset] = useState<MinIntervalPreset>("normal");

  return (
    <Dialog open={open} onClose={onClose} title={`Sync ${kindLabel}`}>
      <Stack gap="md">
        <Text tone="muted" variant="caption">
          Runs a full {kindLabel.toLowerCase()} sync for {scopeLabel}. This can be a large run.
        </Text>

        <SegmentedControl
          label="Rate limit"
          options={MIN_INTERVAL_PRESET_OPTIONS}
          value={preset}
          onChange={setPreset}
        />

        <Row justify="end" gap="sm">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onConfirm(preset)} disabled={isPending}>
            Start sync
          </Button>
        </Row>
      </Stack>
    </Dialog>
  );
}
