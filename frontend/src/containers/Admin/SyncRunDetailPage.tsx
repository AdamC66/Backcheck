import { Navigate, useParams } from "react-router";
import { Button } from "@/components/Button/Button";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import {
  SYNC_KIND_LABELS,
  type SyncRunActivityLogEntry,
  type SyncRunItemPayload,
} from "@/models/adminSync";
import { useCancelSyncRun } from "@/models/useCancelSyncRun";
import { useSyncRun } from "@/models/useSyncRun";

const ACTIVE_STATUSES = new Set(["queued", "running"]);

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full bg-slate-100">
      <div className="h-2 bg-slate-900" style={{ width: `${percent}%` }} />
    </div>
  );
}

function ItemRow({ item }: { item: SyncRunItemPayload }) {
  return (
    <Row justify="between" className="border-b border-slate-100 py-2 last:border-b-0">
      <Text variant="label">{item.team_name ?? SYNC_KIND_LABELS[item.kind]}</Text>
      <Text variant="caption" className="font-semibold tracking-wide uppercase">
        {item.status}
      </Text>
    </Row>
  );
}

function LogLine({ entry }: { entry: SyncRunActivityLogEntry }) {
  return (
    <Text variant="caption" tone="muted" className="block font-mono">
      {entry.message}
    </Text>
  );
}

export function SyncRunDetailPage() {
  const { id } = useParams();
  const runId = Number(id);
  const valid = Number.isInteger(runId) && runId > 0;

  const run = useSyncRun(valid ? runId : null);
  const cancel = useCancelSyncRun(runId);

  if (!valid) {
    return <Navigate to="/admin" replace />;
  }

  if (run.isPending) {
    return <Text tone="muted">Loading sync run…</Text>;
  }

  if (run.isError || run.data === undefined) {
    return <Text tone="danger">Could not load this sync run.</Text>;
  }

  const data = run.data;
  const canCancel = ACTIVE_STATUSES.has(data.status);

  return (
    <Stack gap="lg">
      <Row justify="between">
        <Stack gap="xs">
          <Text variant="subheading">
            {data.sync_kinds.map((kind) => SYNC_KIND_LABELS[kind]).join(", ")}
          </Text>
          <Text tone="muted" variant="caption">
            {data.current_step_label ?? data.status}
          </Text>
        </Stack>

        {canCancel ? (
          <Button
            type="button"
            variant="danger"
            onClick={() => cancel.mutate()}
            disabled={cancel.isPending}
          >
            Cancel
          </Button>
        ) : null}
      </Row>

      <Stack gap="xs">
        <ProgressBar percent={data.percent_complete} />
        <Text tone="muted" variant="caption">
          {data.current_step}/{data.total_steps} ({data.percent_complete}%) — {data.status}
        </Text>
      </Stack>

      <Stack gap="sm">
        <Text variant="label">Items</Text>
        <Stack gap="none" className="border border-slate-200 bg-white px-4">
          {data.items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </Stack>
      </Stack>

      <Stack gap="sm">
        <Text variant="label">Activity log</Text>
        <Stack
          gap="xs"
          className="max-h-64 overflow-y-auto border border-slate-200 bg-slate-50 p-3"
        >
          {[...data.activity_log].reverse().map((entry, index) => (
            <LogLine key={`${entry.at}-${index}`} entry={entry} />
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}
