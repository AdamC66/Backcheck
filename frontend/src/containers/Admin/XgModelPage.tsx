import { Card } from "@/components/Card/Card";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import {
  XG_TRAINING_RUN_STATUS_LABELS,
  type XgModelSummary,
  type XgTrainingRun,
  type XgTrainingRunStatus,
} from "@/models/adminXgModel";
import { useXgModelDashboard } from "@/models/useXgModelDashboard";

const STATUS_CLASS: Record<XgTrainingRunStatus, string> = {
  exported: "bg-slate-100 text-slate-600",
  fitted: "bg-sky-100 text-sky-700",
  promoted: "bg-emerald-100 text-emerald-700",
};

function pct(part: number, whole: number) {
  return whole === 0 ? "—" : `${((100 * part) / whole).toFixed(1)}%`;
}

function num(value: number) {
  return value.toLocaleString();
}

function StatusPill({ status }: { status: XgTrainingRunStatus }) {
  return (
    <span
      className={`px-2 py-0.5 text-xs font-semibold tracking-wide uppercase ${STATUS_CLASS[status]}`}
    >
      {XG_TRAINING_RUN_STATUS_LABELS[status]}
    </span>
  );
}

function CoefficientTable({ coefficients }: { coefficients: Record<string, number> }) {
  const entries = Object.entries(coefficients);
  if (entries.length === 0) return null;

  return (
    <Stack gap="none" className="border border-slate-200">
      {entries.map(([term, weight]) => (
        <Row
          key={term}
          justify="between"
          className="border-b border-slate-100 px-3 py-1.5 last:border-b-0"
        >
          <Text variant="caption" className="font-mono">
            {term}
          </Text>
          <Text variant="caption" className="font-mono">
            {weight.toFixed(4)}
          </Text>
        </Row>
      ))}
    </Stack>
  );
}

function ActiveModelCard({ model }: { model: XgModelSummary | null }) {
  return (
    <Card>
      <Stack gap="sm">
        <Text variant="title">Active model</Text>
        {model === null ? (
          <Text tone="muted">No model is active.</Text>
        ) : (
          <>
            <Row justify="between">
              <Text variant="label">{model.version}</Text>
              <Text tone="muted" variant="caption">
                trained {new Date(model.trained_at).toLocaleDateString()}
              </Text>
            </Row>
            <CoefficientTable coefficients={model.coefficients} />
          </>
        )}
      </Stack>
    </Card>
  );
}

function SeasonBreakdown({ run }: { run: XgTrainingRun }) {
  const perSeason = run.manifest.per_season;
  if (!perSeason) return null;

  return (
    <Stack gap="none">
      {Object.entries(perSeason).map(([season, counts]) => (
        <Text key={season} tone="muted" variant="caption">
          {season}: {num(counts.shots)} shots / {num(counts.goals)} goals (
          {pct(counts.goals, counts.shots)})
        </Text>
      ))}
    </Stack>
  );
}

function Metrics({ run }: { run: XgTrainingRun }) {
  const metrics = run.metrics;
  if (!metrics) return null;

  return (
    <Stack gap="xs">
      <Text variant="caption" className="font-semibold">
        Validation (season held out)
      </Text>
      <Row gap="lg">
        {metrics.brier !== undefined ? (
          <Text variant="caption">
            Brier {metrics.brier.toFixed(4)}
            {metrics.baseline_brier !== undefined
              ? ` (baseline ${metrics.baseline_brier.toFixed(4)})`
              : ""}
          </Text>
        ) : null}
        {metrics.log_loss !== undefined ? (
          <Text variant="caption">Log loss {metrics.log_loss.toFixed(4)}</Text>
        ) : null}
      </Row>
      {metrics.by_season ? (
        <Stack gap="none">
          {Object.entries(metrics.by_season).map(([season, m]) => (
            <Text key={season} tone="muted" variant="caption">
              held out {season}: Brier {m.brier.toFixed(4)}, log loss {m.log_loss.toFixed(4)}
            </Text>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}

function Calibration({ run }: { run: XgTrainingRun }) {
  const bins = run.calibration;
  if (!bins || bins.length === 0) return null;

  return (
    <Stack gap="xs">
      <Text variant="caption" className="font-semibold">
        Calibration
      </Text>
      <Stack gap="none" className="border border-slate-200">
        <Row justify="between" className="border-b border-slate-100 px-3 py-1 last:border-b-0">
          <Text variant="caption" className="font-semibold">
            predicted
          </Text>
          <Text variant="caption" className="font-semibold">
            observed
          </Text>
          <Text variant="caption" className="font-semibold">
            n
          </Text>
        </Row>
        {bins.map((bin, index) => (
          <Row
            key={index}
            justify="between"
            className="border-b border-slate-100 px-3 py-1 last:border-b-0"
          >
            <Text variant="caption" className="font-mono">
              {bin.predicted.toFixed(3)}
            </Text>
            <Text variant="caption" className="font-mono">
              {bin.observed.toFixed(3)}
            </Text>
            <Text variant="caption" className="font-mono">
              {num(bin.count)}
            </Text>
          </Row>
        ))}
      </Stack>
    </Stack>
  );
}

function SampleGames({ run }: { run: XgTrainingRun }) {
  const games = run.sample_games;
  if (!games || games.length === 0) return null;

  return (
    <Stack gap="xs">
      <Text variant="caption" className="font-semibold">
        Held-out sample games (team xG vs actual goals)
      </Text>
      <Stack gap="none">
        {games.map((game, index) => (
          <Text key={index} tone="muted" variant="caption">
            {game.matchup ? `${game.matchup} — ` : ""}
            {game.team}: {game.xg.toFixed(2)} xG / {game.goals} goals
          </Text>
        ))}
      </Stack>
    </Stack>
  );
}

function TrainingRunCard({ run }: { run: XgTrainingRun }) {
  return (
    <Card>
      <Stack gap="sm">
        <Row justify="between" align="start">
          <Stack gap="xs">
            <Text variant="label">{run.label ?? `Run #${run.id}`}</Text>
            <Text tone="muted" variant="caption">
              {num(run.row_count)} shots · {num(run.goal_count)} goals (
              {pct(run.goal_count, run.row_count)})
              {run.feature_set ? ` · features: ${run.feature_set.join(", ")}` : ""}
            </Text>
          </Stack>
          <Stack gap="xs" align="end">
            <StatusPill status={run.status} />
            <Text tone="muted" variant="caption">
              {new Date(run.created_at).toLocaleString()}
            </Text>
          </Stack>
        </Row>

        <SeasonBreakdown run={run} />
        {run.metrics ? <Metrics run={run} /> : null}
        {run.calibration ? <Calibration run={run} /> : null}
        {run.sample_games ? <SampleGames run={run} /> : null}
        {run.coefficients ? <CoefficientTable coefficients={run.coefficients} /> : null}
        {run.notes ? <Text variant="caption">{run.notes}</Text> : null}

        <Text tone="muted" variant="caption" className="font-mono break-all">
          {run.csv_path} · sha256 {run.csv_sha256.slice(0, 16)}…
          {run.source_file ? ` · fit ${run.source_file}` : ""}
        </Text>
      </Stack>
    </Card>
  );
}

export function XgModelPage() {
  const dashboard = useXgModelDashboard();

  if (dashboard.isPending) {
    return <Text tone="muted">Loading xG model…</Text>;
  }

  if (dashboard.isError) {
    return <Text tone="danger">Could not load the xG model.</Text>;
  }

  const { active_model, training_runs } = dashboard.data;

  return (
    <Stack gap="md">
      <Text variant="subheading">xG Model</Text>

      <ActiveModelCard model={active_model} />

      <Stack gap="sm">
        <Text variant="title">Training runs</Text>
        {training_runs.length === 0 ? (
          <Text tone="muted">
            No training runs yet. Run <span className="font-mono">rake xg:export_training_set</span>
            .
          </Text>
        ) : (
          training_runs.map((run) => <TrainingRunCard key={run.id} run={run} />)
        )}
      </Stack>
    </Stack>
  );
}
