import { useState } from "react";
import { useNavigate } from "react-router";
import { CoverageMatrix } from "@/components/CoverageMatrix/CoverageMatrix";
import { Select } from "@/components/Select/Select";
import { Stack } from "@/components/Stack/Stack";
import { SyncCoverageDialog } from "@/components/SyncCoverageDialog/SyncCoverageDialog";
import { Text } from "@/components/Text/Text";
import type { MinIntervalPreset } from "@/models/adminSync";
import { COVERAGE_KIND_LABELS, COVERAGE_SYNC_KIND, type CoverageKind } from "@/models/coverage";
import { useCoverage } from "@/models/useCoverage";
import { useCreateSyncRun } from "@/models/useCreateSyncRun";
import { useLeagues } from "@/models/useLeagues";

interface PendingSync {
  seasonId: number;
  seasonLabel: string;
  kind: CoverageKind;
}

export function DataCoveragePage() {
  const navigate = useNavigate();
  const leagues = useLeagues();
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingSync | null>(null);

  const activeLeagueId = leagueId ?? leagues.data?.[0]?.id ?? null;
  const league = leagues.data?.find((entry) => entry.id === activeLeagueId);
  const coverage = useCoverage(activeLeagueId);
  const createSyncRun = useCreateSyncRun();

  function confirmSync(preset: MinIntervalPreset) {
    if (pending === null || activeLeagueId === null) return;

    createSyncRun.mutate(
      {
        sync_kinds: [COVERAGE_SYNC_KIND[pending.kind]],
        league_id: activeLeagueId,
        season_id: pending.seasonId,
        min_interval_preset: preset,
      },
      {
        onSuccess: (run) => {
          setPending(null);
          navigate(`/admin/sync/${run.id}`);
        },
      },
    );
  }

  return (
    <Stack gap="lg">
      <Text variant="subheading">Data coverage</Text>

      <Select
        id="coverage-league"
        label="League"
        options={(leagues.data ?? []).map((entry) => ({
          value: String(entry.id),
          label: entry.name,
        }))}
        value={activeLeagueId === null ? "" : String(activeLeagueId)}
        onChange={(event) => setLeagueId(Number(event.target.value))}
      />

      {coverage.isPending ? <Text tone="muted">Loading coverage…</Text> : null}
      {coverage.isError ? <Text tone="danger">Could not load coverage.</Text> : null}

      {coverage.data ? (
        <CoverageMatrix
          rows={coverage.data}
          onSync={(row, kind) =>
            setPending({ seasonId: row.season_id, seasonLabel: row.season_label, kind })
          }
        />
      ) : null}

      {pending ? (
        <SyncCoverageDialog
          open
          onClose={() => setPending(null)}
          kindLabel={COVERAGE_KIND_LABELS[pending.kind]}
          scopeLabel={`${league?.name ?? "league"} — ${pending.seasonLabel}`}
          isPending={createSyncRun.isPending}
          onConfirm={confirmSync}
        />
      ) : null}
    </Stack>
  );
}
