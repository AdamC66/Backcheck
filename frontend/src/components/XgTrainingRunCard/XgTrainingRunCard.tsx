import { Fragment, type ReactNode } from "react";
import { Card } from "@/components/Card/Card";
import { CoefficientTable } from "@/components/CoefficientTable/CoefficientTable";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import {
  type XgTrainingRun,
  type XgTrainingRunStatus,
  XG_TRAINING_RUN_STATUS_LABELS,
} from "@/models/adminXgModel";

const STATUS_CLASS: Record<XgTrainingRunStatus, string> = {
  exported: "bg-slate-100 text-slate-600",
  fitted: "bg-sky-100 text-sky-700",
  promoted: "bg-emerald-100 text-emerald-700",
};

function rate(part: number, whole: number) {
  return whole === 0 ? "—" : `${((100 * part) / whole).toFixed(1)}%`;
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

function LabeledBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap="xs">
      <Text variant="caption" className="font-semibold">
        {label}
      </Text>
      {children}
    </Stack>
  );
}

function SeasonBreakdown({ run }: { run: XgTrainingRun }) {
  const perSeason = run.manifest.per_season;
  if (!perSeason) return null;

  return (
    <Stack gap="none">
      {Object.entries(perSeason).map(([season, counts]) => (
        <Text key={season} tone="muted" variant="caption">
          {season}: {counts.shots.toLocaleString()} shots / {counts.goals.toLocaleString()} goals (
          {rate(counts.goals, counts.shots)})
        </Text>
      ))}
    </Stack>
  );
}

function Metrics({ run }: { run: XgTrainingRun }) {
  const metrics = run.metrics;
  if (!metrics) return null;
  const summary = metrics.game_xg_summary;

  return (
    <LabeledBlock label="Validation (season held out)">
      <Row gap="lg">
        {metrics.brier !== undefined ? (
          <Text variant="caption">Brier {metrics.brier.toFixed(4)}</Text>
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
      {summary ? (
        <Text tone="muted" variant="caption">
          per-team-per-game xG: mean {summary.mean.toFixed(2)}, 90% within [{summary.p05.toFixed(2)}
          , {summary.p95.toFixed(2)}]
          {metrics.goal_rate !== undefined
            ? ` · goal rate ${(100 * metrics.goal_rate).toFixed(2)}%`
            : ""}
        </Text>
      ) : null}
    </LabeledBlock>
  );
}

function Calibration({ run }: { run: XgTrainingRun }) {
  const bins = run.calibration;
  if (!bins || bins.length === 0) return null;

  return (
    <LabeledBlock label="Calibration">
      <div className="grid grid-cols-3 gap-x-6 border border-slate-200 px-3 py-1 font-mono text-xs">
        <span className="font-semibold">predicted</span>
        <span className="font-semibold">observed</span>
        <span className="font-semibold">n</span>
        {bins.map((bin, index) => (
          <Fragment key={index}>
            <span>{bin.predicted.toFixed(3)}</span>
            <span>{bin.observed.toFixed(3)}</span>
            <span>{bin.count.toLocaleString()}</span>
          </Fragment>
        ))}
      </div>
    </LabeledBlock>
  );
}

function SampleGames({ run }: { run: XgTrainingRun }) {
  const games = run.sample_games;
  if (!games || games.length === 0) return null;

  return (
    <LabeledBlock label="Held-out sample games (team xG vs actual goals)">
      <Stack gap="none">
        {games.map((game, index) => (
          <Text key={index} tone="muted" variant="caption">
            {game.matchup ? `${game.matchup} — ` : ""}
            {game.team}: {game.xg.toFixed(2)} xG / {game.goals} goals
          </Text>
        ))}
      </Stack>
    </LabeledBlock>
  );
}

export interface XgTrainingRunCardProps {
  run: XgTrainingRun;
}

export function XgTrainingRunCard({ run }: XgTrainingRunCardProps) {
  return (
    <Card>
      <Stack gap="sm">
        <Row justify="between" align="start">
          <Stack gap="xs">
            <Text variant="label">{run.label ?? `Run #${run.id}`}</Text>
            <Text tone="muted" variant="caption">
              {run.row_count.toLocaleString()} shots · {run.goal_count.toLocaleString()} goals (
              {rate(run.goal_count, run.row_count)})
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
        <Metrics run={run} />
        <Calibration run={run} />
        <SampleGames run={run} />
        {run.coefficients ? <CoefficientTable coefficients={run.coefficients} /> : null}

        <Text tone="muted" variant="caption" className="font-mono break-all">
          {run.csv_path} · sha256 {run.csv_sha256.slice(0, 16)}…
          {run.source_file ? ` · fit ${run.source_file}` : ""}
        </Text>
      </Stack>
    </Card>
  );
}
