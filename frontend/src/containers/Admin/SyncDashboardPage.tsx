import { Link } from "react-router";
import { Button } from "@/components/Button/Button";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { SYNC_KIND_LABELS, type SyncRun } from "@/models/adminSync";
import { useSyncRuns } from "@/models/useSyncRuns";

function kindsLabel(run: SyncRun) {
  return run.sync_kinds.map((kind) => SYNC_KIND_LABELS[kind]).join(", ");
}

function SyncRunRow({ run }: { run: SyncRun }) {
  return (
    <Link
      to={`/admin/sync/${run.id}`}
      className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
    >
      <Row justify="between" className="border-b border-slate-100 py-3 last:border-b-0">
        <Stack gap="xs">
          <Text variant="label">{kindsLabel(run)}</Text>
          <Text tone="muted" variant="caption">
            {run.current_step_label ?? "Queued"}
          </Text>
        </Stack>
        <Stack gap="xs" align="end">
          <Text variant="caption" className="font-semibold tracking-wide uppercase">
            {run.status}
          </Text>
          <Text tone="muted" variant="caption">
            {run.current_step}/{run.total_steps} ({run.percent_complete}%)
          </Text>
        </Stack>
      </Row>
    </Link>
  );
}

export function SyncDashboardPage() {
  const runs = useSyncRuns();

  return (
    <Stack gap="md">
      <Row justify="between">
        <Text variant="subheading">Sync Runs</Text>
        <Link to="/admin/sync/new">
          <Button type="button" size="sm">
            New Sync
          </Button>
        </Link>
      </Row>

      {runs.isPending ? <Text tone="muted">Loading sync runs…</Text> : null}
      {runs.isError ? <Text tone="danger">Could not load sync runs.</Text> : null}
      {runs.data?.data.length === 0 ? <Text tone="muted">No sync runs yet.</Text> : null}

      {runs.data?.data.length ? (
        <Stack gap="none" className="border border-slate-200 bg-white px-4">
          {runs.data.data.map((run) => (
            <SyncRunRow key={run.id} run={run} />
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
