import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { ChevronIcon } from "@/components/ChevronIcon/ChevronIcon";
import { PageShell } from "@/components/PageShell/PageShell";
import { PlayerAdvancedSeasonsTable } from "@/components/PlayerAdvancedSeasonsTable/PlayerAdvancedSeasonsTable";
import { PlayerGoalieSeasonsTable } from "@/components/PlayerGoalieSeasonsTable/PlayerGoalieSeasonsTable";
import { PlayerSkaterSeasonsTable } from "@/components/PlayerSkaterSeasonsTable/PlayerSkaterSeasonsTable";
import { Row } from "@/components/Row/Row";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { TeamTheme } from "@/components/TeamTheme/TeamTheme";
import { UserMenu } from "@/containers/UserMenu";
import { positionAbbreviation } from "@/lib/roster";
import type { ScoreState, StrengthState } from "@/models/gameDetail";
import type { GameType } from "@/models/teamStats";
import { usePlayerDetail } from "@/models/usePlayerDetail";

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

const BACK_LINK_CLASS =
  "mb-1 flex w-fit items-center gap-1.5 text-xs font-bold tracking-wide text-slate-400 uppercase hover:text-slate-600";

// A player is reached from several other pages (a team roster, eventually a game box
// score), so "back" means the page the visitor actually came from, not a fixed parent
// route. A direct/refreshed load has no such entry — "default" is react-router's key
// for that case — so it falls back to the dashboard instead of leaving the app.
function BackLink() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.key === "default") {
    return (
      <Link to="/" className={BACK_LINK_CLASS}>
        <ChevronIcon direction="left" />
        Dashboard
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => navigate(-1)} className={BACK_LINK_CLASS}>
      <ChevronIcon direction="left" />
      Back
    </button>
  );
}

// A valid :id is trusted the same way TeamPage's child pages trust theirs — the API
// 404s and the error branch below covers a bad or stale link.
export function PlayerPage() {
  const { id } = useParams();
  const playerId = Number(id);
  const [searchParams, setSearchParams] = useSearchParams();

  const gameType: GameType = isGameType(searchParams.get("game_type"))
    ? (searchParams.get("game_type") as GameType)
    : "regular_season";
  const detail = usePlayerDetail(playerId, gameType);

  const strengthState: StrengthState = isStrengthState(searchParams.get("strength"))
    ? (searchParams.get("strength") as StrengthState)
    : "all";
  const scoreState: ScoreState = isScoreState(searchParams.get("score"))
    ? (searchParams.get("score") as ScoreState)
    : "all";

  if (detail.isPending) {
    return (
      <PageShell actions={<UserMenu />}>
        <BackLink />
        <Text tone="muted">Loading player…</Text>
      </PageShell>
    );
  }

  if (detail.isError) {
    return (
      <PageShell actions={<UserMenu />}>
        <BackLink />
        <Text tone="danger">Could not load this player.</Text>
      </PageShell>
    );
  }

  const {
    player,
    current_team: currentTeam,
    skater_seasons: skaterSeasons,
    goalie_seasons: goalieSeasons,
  } = detail.data.data;
  const advancedSeasons = detail.data.data.advanced_seasons.filter(
    (row) => row.strength_state === strengthState && row.score_state === scoreState,
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

  const handednessLabel = player.position === "goalie" ? "Catches" : "Shoots";

  return (
    <PageShell actions={<UserMenu />}>
      <TeamTheme team={currentTeam ?? undefined}>
        <Stack gap="lg">
          <BackLink />

          <Row gap="md" wrap className="bg-team-primary p-5 text-team-contrast">
            {player.headshot_url === null ? null : (
              <img
                src={player.headshot_url}
                alt=""
                className="h-20 w-20 shrink-0 rounded-full bg-white/10 object-cover"
              />
            )}
            {currentTeam?.logo_url == null ? null : (
              <span className="flex size-14 shrink-0 items-center justify-center self-center bg-white p-1.5">
                <img
                  src={currentTeam.logo_url}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              </span>
            )}
            <Stack gap="xs">
              <Text variant="heading" className="font-display tracking-wide text-team-contrast">
                {player.first_name} {player.last_name}
              </Text>
              <Text
                variant="caption"
                className="font-bold tracking-wide text-team-contrast/70 uppercase"
              >
                Position: {positionAbbreviation(player.position)}
                {player.shoots_catches === null
                  ? ""
                  : ` · ${handednessLabel}: ${player.shoots_catches}`}
                {currentTeam === null ? "" : ` · ${currentTeam.name}`}
              </Text>
            </Stack>
          </Row>

          <Row justify="between" align="baseline" wrap>
            <Text variant="label" className="font-bold tracking-wide text-slate-500 uppercase">
              Season by season
            </Text>
            <SegmentedControl
              options={GAME_TYPE_OPTIONS}
              value={gameType}
              onChange={(value) => updateFilter({ gameType: value })}
              label="Game type"
            />
          </Row>

          {skaterSeasons.length === 0 && goalieSeasons.length === 0 ? (
            <Text tone="muted">No stats recorded for this player yet.</Text>
          ) : (
            <Stack gap="lg">
              {skaterSeasons.length === 0 ? null : (
                <PlayerSkaterSeasonsTable seasons={skaterSeasons} />
              )}
              {goalieSeasons.length === 0 ? null : (
                <PlayerGoalieSeasonsTable seasons={goalieSeasons} />
              )}
            </Stack>
          )}

          {detail.data.data.advanced_seasons.length === 0 ? null : (
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

              {advancedSeasons.length === 0 ? (
                <Text tone="muted">No advanced stats recorded for this split yet.</Text>
              ) : (
                <PlayerAdvancedSeasonsTable seasons={advancedSeasons} />
              )}
            </Stack>
          )}
        </Stack>
      </TeamTheme>
    </PageShell>
  );
}
