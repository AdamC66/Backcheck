import { useParams, useSearchParams } from "react-router";
import { GoalieStatsTable } from "@/components/GoalieStatsTable/GoalieStatsTable";
import { PlayerSeasonAdvancedStatsTable } from "@/components/PlayerSeasonAdvancedStatsTable/PlayerSeasonAdvancedStatsTable";
import { Row } from "@/components/Row/Row";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { SkaterStatsTable } from "@/components/SkaterStatsTable/SkaterStatsTable";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import type { ScoreState, StrengthState } from "@/models/gameDetail";
import type { GameType, TeamSeasonAdvancedStat } from "@/models/teamStats";
import { useTeamStats } from "@/models/useTeamStats";

const GAME_TYPE_OPTIONS: { value: GameType; label: string }[] = [
  { value: "preseason", label: "Preseason" },
  { value: "regular_season", label: "Regular season" },
  { value: "playoffs", label: "Playoffs" },
];

const STRENGTH_OPTIONS: { value: StrengthState; label: string }[] = [
  { value: "all", label: "All" },
  { value: "5v5", label: "5v5" },
  { value: "pp", label: "PP" },
  { value: "sh", label: "SH" },
];

const SCORE_OPTIONS: { value: ScoreState; label: string }[] = [
  { value: "all", label: "All situations" },
  { value: "close", label: "Close" },
];

function isGameType(value: string | null): value is GameType {
  return value === "preseason" || value === "regular_season" || value === "playoffs";
}

function isStrengthState(value: string | null): value is StrengthState {
  return value === "all" || value === "5v5" || value === "pp" || value === "sh";
}

function isScoreState(value: string | null): value is ScoreState {
  return value === "all" || value === "close";
}

function TeamAdvancedSummary({ stat }: { stat: TeamSeasonAdvancedStat | undefined }) {
  if (stat === undefined) {
    return <Text tone="muted">No team advanced stats recorded for this split yet.</Text>;
  }

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
      <dt className="text-slate-500">GP</dt>
      <dd className="tabular-nums">{stat.games_played}</dd>
      <dt className="text-slate-500">Corsi</dt>
      <dd className="tabular-nums">
        {stat.corsi_for}–{stat.corsi_against}
      </dd>
      <dt className="text-slate-500">Fenwick</dt>
      <dd className="tabular-nums">
        {stat.fenwick_for}–{stat.fenwick_against}
      </dd>
      <dt className="text-slate-500">xG</dt>
      <dd className="tabular-nums">
        {stat.xg_for.toFixed(2)}–{stat.xg_against.toFixed(2)}
      </dd>
    </dl>
  );
}

// A valid :id is guaranteed by TeamPage, which redirects before this ever renders.
export function TeamStatsPage() {
  const { id } = useParams();
  const teamId = Number(id);
  const [searchParams, setSearchParams] = useSearchParams();

  const gameType: GameType = isGameType(searchParams.get("game_type"))
    ? (searchParams.get("game_type") as GameType)
    : "regular_season";
  const stats = useTeamStats(teamId, gameType);

  const strengthState: StrengthState = isStrengthState(searchParams.get("strength"))
    ? (searchParams.get("strength") as StrengthState)
    : "all";
  const scoreState: ScoreState = isScoreState(searchParams.get("score"))
    ? (searchParams.get("score") as ScoreState)
    : "all";

  if (stats.isPending) {
    return <Text tone="muted">Loading stats…</Text>;
  }

  if (stats.isError) {
    return <Text tone="danger">Could not load this team's stats.</Text>;
  }

  const { skaters, goalies, advanced } = stats.data.data;

  const filteredTeamAdvanced = advanced.team.find(
    (stat) => stat.strength_state === strengthState && stat.score_state === scoreState,
  );
  const filteredPlayerAdvanced = advanced.players.filter(
    (stat) => stat.strength_state === strengthState && stat.score_state === scoreState,
  );

  function updateFilter(changes: {
    gameType?: GameType;
    strength?: StrengthState;
    score?: ScoreState;
  }) {
    const next = new URLSearchParams(searchParams);
    if (changes.gameType !== undefined) next.set("game_type", changes.gameType);
    if (changes.strength !== undefined) next.set("strength", changes.strength);
    if (changes.score !== undefined) next.set("score", changes.score);
    setSearchParams(next, { replace: true });
  }

  return (
    <Stack gap="lg">
      <Row justify="between" align="baseline" wrap>
        <Text variant="heading" className="font-display tracking-wide">
          Stats
        </Text>
        <Row gap="sm" align="baseline" wrap>
          {stats.data.meta === undefined ? null : (
            <Text variant="caption" className="font-bold tracking-wide text-slate-400 uppercase">
              {stats.data.meta.season}
            </Text>
          )}
          <SegmentedControl
            options={GAME_TYPE_OPTIONS}
            value={gameType}
            onChange={(value) => updateFilter({ gameType: value })}
            label="Game type"
          />
        </Row>
      </Row>

      {skaters.length === 0 && goalies.length === 0 ? (
        <Text tone="muted">No stats recorded for this season yet.</Text>
      ) : (
        <Stack gap="lg">
          <Stack gap="sm">
            <Text variant="label" className="font-bold tracking-wide text-slate-500 uppercase">
              Skaters
            </Text>
            {skaters.length === 0 ? (
              <Text tone="muted">No skater stats recorded for this season yet.</Text>
            ) : (
              <SkaterStatsTable stats={skaters} />
            )}
          </Stack>

          <Stack gap="sm">
            <Text variant="label" className="font-bold tracking-wide text-slate-500 uppercase">
              Goalies
            </Text>
            {goalies.length === 0 ? (
              <Text tone="muted">No goalie stats recorded for this season yet.</Text>
            ) : (
              <GoalieStatsTable stats={goalies} />
            )}
          </Stack>
        </Stack>
      )}

      {advanced.team.length === 0 && advanced.players.length === 0 ? null : (
        <Stack gap="sm">
          <Row justify="between" align="baseline" wrap>
            <Text variant="label" className="font-bold tracking-wide text-slate-500 uppercase">
              Advanced
            </Text>
            <Row gap="sm" wrap>
              <SegmentedControl
                options={STRENGTH_OPTIONS}
                value={strengthState}
                onChange={(value) => updateFilter({ strength: value })}
                label="Strength state"
              />
              <SegmentedControl
                options={SCORE_OPTIONS}
                value={scoreState}
                onChange={(value) => updateFilter({ score: value })}
                label="Score state"
              />
            </Row>
          </Row>

          <TeamAdvancedSummary stat={filteredTeamAdvanced} />

          {filteredPlayerAdvanced.length === 0 ? (
            <Text tone="muted">No player advanced stats recorded for this split yet.</Text>
          ) : (
            <PlayerSeasonAdvancedStatsTable stats={filteredPlayerAdvanced} />
          )}
        </Stack>
      )}
    </Stack>
  );
}
