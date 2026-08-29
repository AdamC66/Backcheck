import { Link } from "react-router";
import { Button } from "@/components/Button/Button";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import type { CoverageCell as Cell, CoverageKind } from "@/models/coverage";

export interface CoverageCellProps {
  cell: Cell;
  seasonId: number;
  kind: CoverageKind;
  onSync: () => void;
}

function ratioTone(synced: number, total: number | null): string {
  if (total === null) return "text-slate-700";
  if (synced >= total) return "text-emerald-700";
  return "text-amber-700";
}

export function CoverageCell({ cell, seasonId, kind, onSync }: CoverageCellProps) {
  if (cell.synced === null) {
    return (
      <Text variant="caption" tone="muted">
        n/a
      </Text>
    );
  }

  return (
    <Stack gap="xs" align="start">
      <Link
        to={`/admin/data/${seasonId}/${kind}`}
        className="font-medium tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        <span className={ratioTone(cell.synced, cell.total)}>
          {cell.synced}
          {cell.total === null ? "" : ` / ${cell.total}`}
        </span>
      </Link>

      {cell.stale > 0 ? (
        <Text variant="caption" className="text-amber-700">
          {cell.stale} stale
        </Text>
      ) : null}
      {cell.syncing > 0 ? (
        <Text variant="caption" className="text-sky-700">
          {cell.syncing} syncing
        </Text>
      ) : null}

      <Button type="button" variant="secondary" size="sm" onClick={onSync}>
        Sync
      </Button>
    </Stack>
  );
}
