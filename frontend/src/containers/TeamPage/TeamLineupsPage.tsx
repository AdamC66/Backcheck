import { useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { Button } from "@/components/Button/Button";
import { LineupEditor } from "@/components/LineupEditor/LineupEditor";
import { LineupSheet } from "@/components/LineupSheet/LineupSheet";
import { Row } from "@/components/Row/Row";
import { Select } from "@/components/Select/Select";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { useAuth } from "@/auth/useAuth";
import { ApiError } from "@/lib/apiClient";
import { formatFullDate, formatMonthDay } from "@/lib/format";
import { isTeamCoach } from "@/lib/membership";
import { recentTeamGames, upcomingTeamGames } from "@/lib/teamSchedule";
import type { Game } from "@/models/games";
import { useLineup } from "@/models/useLineup";
import { usePreviousLineup } from "@/models/usePreviousLineup";
import { useSeasons } from "@/models/useSeasons";
import { useSetLineup } from "@/models/useSetLineup";
import { useTeam } from "@/models/useTeam";
import { useTeamGames } from "@/models/useTeamGames";
import { useTeamRoster } from "@/models/useTeamRoster";

const FINISHED_STATES = ["FINAL", "OFF"];
const DISCARD_PROMPT = "You have unsaved lineup changes. Leave without saving?";

// A valid :id is guaranteed by TeamPage, which redirects before this ever renders.
export function TeamLineupsPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const teamId = Number(id);
  const { user } = useAuth();

  const [editing, setEditing] = useState(false);
  const [editorDirty, setEditorDirty] = useState(false);

  const team = useTeam(teamId);
  const seasons = useSeasons(team.data?.league?.slug ?? null);
  const games = useTeamGames(teamId, { season: searchParams.get("season") ?? undefined });
  const resolvedSeason = games.data?.meta?.season;

  const gameList = games.data?.data ?? [];
  const selectedGameId = resolveGameId(searchParams.get("game"), gameList, teamId);
  const selectedGame = gameList.find((game) => game.id === selectedGameId) ?? null;
  const upcoming = selectedGame !== null && !FINISHED_STATES.includes(selectedGame.state);

  const lineup = useLineup(teamId, selectedGameId);
  const lineupNotFound = lineup.error instanceof ApiError && lineup.error.status === 404;
  const setLineup = useSetLineup(teamId, selectedGameId ?? 0);

  const canEdit = user !== null && (user.is_super_admin || (upcoming && isTeamCoach(user, teamId)));
  const roster = useTeamRoster(editing && canEdit ? teamId : null, resolvedSeason);
  const previousLineup = usePreviousLineup(teamId, selectedGameId, editing && canEdit);
  const templateGame =
    previousLineup.data && gameList.find((game) => game.id === previousLineup.data.game_id);

  // The app is on a non-data <BrowserRouter>, so useBlocker isn't available for in-app
  // nav; guard the actions that would drop the editor's state, and let beforeunload
  // (in LineupEditor) cover a full-page leave.
  function confirmLeave(): boolean {
    return !editorDirty || window.confirm(DISCARD_PROMPT);
  }

  function patchParams(next: Record<string, string>) {
    const merged = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) merged.set(key, value);

    // Re-set even on cancel: the native <select> has already moved to the new option,
    // and re-navigating (here to the unchanged URL) forces it back to the real value.
    setSearchParams(confirmLeave() ? merged : new URLSearchParams(searchParams), { replace: true });
  }

  function stopEditing() {
    if (confirmLeave()) setEditing(false);
  }

  return (
    <Stack gap="sm">
      <Row justify="between" align="baseline" wrap>
        <Text variant="heading" className="font-display tracking-wide">
          Lineups
        </Text>
        {selectedGame === null ? null : (
          <Text variant="caption" className="font-bold tracking-wide text-slate-400 uppercase">
            {formatFullDate(selectedGame.game_date)}
          </Text>
        )}
      </Row>

      <Row gap="sm" wrap align="end">
        {seasons.data && seasons.data.length > 0 ? (
          <Select
            id="lineup-season"
            label="Season"
            value={resolvedSeason ?? ""}
            onChange={(event) => patchParams({ season: event.target.value })}
            options={seasons.data.map((season) => ({ value: season.label, label: season.label }))}
            className="max-w-40"
          />
        ) : null}

        {gameList.length > 0 && selectedGameId !== null ? (
          <Select
            id="lineup-game"
            label="Game"
            value={String(selectedGameId)}
            onChange={(event) => patchParams({ game: event.target.value })}
            options={gameList.map((game) => ({
              value: String(game.id),
              label: gameLabel(game, teamId),
            }))}
            className="max-w-xs"
          />
        ) : null}
      </Row>

      {games.isPending ? <Text tone="muted">Loading schedule…</Text> : null}
      {games.isError ? <Text tone="danger">Could not load this team's schedule.</Text> : null}
      {games.isSuccess && gameList.length === 0 ? (
        <Text tone="muted">No games recorded for this season yet.</Text>
      ) : null}

      {selectedGameId === null || gameList.length === 0 ? null : (
        <Stack gap="sm">
          {canEdit ? (
            <Row justify="between" align="center">
              {lineup.data && !lineup.data.historical ? <DraftBadge /> : <span />}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => (editing ? stopEditing() : setEditing(true))}
              >
                {editing ? "Done editing" : "Edit lineup"}
              </Button>
            </Row>
          ) : null}

          {lineup.isPending ? <Text tone="muted">Loading lineup…</Text> : null}

          {lineup.isError && !lineupNotFound ? (
            <Text tone="danger">Could not load this lineup.</Text>
          ) : null}

          {lineup.isError && lineupNotFound && !editing ? (
            <Text tone="muted">
              {upcoming
                ? "No lineup has been set for this game yet."
                : "No lineup was recorded for this game."}
            </Text>
          ) : null}

          {editing && canEdit && !lineup.isPending ? (
            roster.isPending ? (
              <Text tone="muted">Loading roster…</Text>
            ) : roster.isError ? (
              <Text tone="danger">Could not load the roster for this season.</Text>
            ) : (
              <LineupEditor
                key={`${selectedGameId}:${lineup.dataUpdatedAt}:${lineup.errorUpdatedAt}`}
                initialLineup={lineup.data ?? null}
                roster={roster.data?.data ?? []}
                isSaving={setLineup.isPending}
                onSave={(input) => setLineup.mutate(input)}
                templateLineup={previousLineup.data ?? null}
                templateLabel={templateGame ? gameLabel(templateGame, teamId) : undefined}
                onDirtyChange={setEditorDirty}
              />
            )
          ) : null}

          {!editing && lineup.data ? <LineupSheet lineup={lineup.data} /> : null}
        </Stack>
      )}
    </Stack>
  );
}

function DraftBadge() {
  return (
    <span className="w-fit bg-amber-100 px-2 py-1">
      <Text variant="caption" className="font-bold tracking-wide text-amber-800 uppercase">
        Draft · visible to this team only
      </Text>
    </span>
  );
}

function resolveGameId(param: string | null, games: Game[], teamId: number): number | null {
  const requested = param === null ? null : Number(param);
  if (requested !== null && games.some((game) => game.id === requested)) {
    return requested;
  }

  const next = upcomingTeamGames(games, teamId, 1)[0];
  if (next !== undefined) return next.game.id;

  return recentTeamGames(games, teamId, 1)[0]?.game.id ?? null;
}

function gameLabel(game: Game, teamId: number): string {
  const isHome = game.home.team.id === teamId;
  const opponent = isHome ? game.away.team : game.home.team;

  return `${isHome ? "vs" : "@"} ${opponent.abbreviation} · ${formatMonthDay(game.game_date)}`;
}
