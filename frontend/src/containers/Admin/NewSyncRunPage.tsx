import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/Button/Button";
import { Row } from "@/components/Row/Row";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { Select } from "@/components/Select/Select";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { SYNC_KIND_LABELS, type MinIntervalPreset, type SyncKind } from "@/models/adminSync";
import { useCreateSyncRun } from "@/models/useCreateSyncRun";
import { useLeague } from "@/models/useLeague";
import { useLeagues } from "@/models/useLeagues";
import { useSeasons } from "@/models/useSeasons";
import { useSyncKinds } from "@/models/useSyncKinds";

const PRESET_OPTIONS: { value: MinIntervalPreset; label: string }[] = [
  { value: "conservative", label: "Conservative" },
  { value: "normal", label: "Normal" },
  { value: "aggressive", label: "Aggressive" },
];

export function NewSyncRunPage() {
  const navigate = useNavigate();
  const leagues = useLeagues();
  const kinds = useSyncKinds();
  const createSyncRun = useCreateSyncRun();

  const [kind, setKind] = useState<SyncKind | "">("");
  const [leagueSlug, setLeagueSlug] = useState("");
  const [teamId, setTeamId] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [preset, setPreset] = useState<MinIntervalPreset>("normal");

  const league = useLeague(leagueSlug);
  const seasons = useSeasons(leagueSlug === "" ? null : leagueSlug);

  const scope = kinds.data?.find((entry) => entry.kind === kind)?.scope ?? [];
  const needsTeam = scope.includes("team");
  const needsSeason = scope.includes("season");

  const selectedLeague = leagues.data?.find((entry) => entry.slug === leagueSlug);
  const canSubmit = kind !== "" && selectedLeague !== undefined && !createSyncRun.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (kind === "" || selectedLeague === undefined) {
      return;
    }

    createSyncRun.mutate(
      {
        sync_kinds: [kind],
        league_id: selectedLeague.id,
        team_id: teamId === "" ? undefined : Number(teamId),
        season_id: seasonId === "" ? undefined : Number(seasonId),
        min_interval_preset: preset,
      },
      { onSuccess: () => navigate("/admin") },
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="lg" className="max-w-md">
        <Text variant="subheading">New Sync</Text>

        <Select
          id="sync-kind"
          label="What to sync"
          placeholder="Choose a sync kind"
          options={(kinds.data ?? []).map((entry) => ({
            value: entry.kind,
            label: SYNC_KIND_LABELS[entry.kind],
          }))}
          value={kind}
          onChange={(event) => setKind(event.target.value as SyncKind)}
        />

        <Select
          id="sync-league"
          label="League"
          placeholder="Choose a league"
          options={(leagues.data ?? []).map((entry) => ({ value: entry.slug, label: entry.name }))}
          value={leagueSlug}
          onChange={(event) => {
            setLeagueSlug(event.target.value);
            setTeamId("");
            setSeasonId("");
          }}
        />

        {needsTeam && leagueSlug !== "" ? (
          <Select
            id="sync-team"
            label="Team"
            placeholder="All teams in this league"
            options={(league.data?.teams ?? []).map((team) => ({
              value: String(team.id),
              label: team.name,
            }))}
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
          />
        ) : null}

        {needsSeason && leagueSlug !== "" ? (
          <Select
            id="sync-season"
            label="Season"
            placeholder="Choose a season"
            options={(seasons.data ?? []).map((season) => ({
              value: String(season.id),
              label: season.label,
            }))}
            value={seasonId}
            onChange={(event) => setSeasonId(event.target.value)}
          />
        ) : null}

        <SegmentedControl
          label="Rate limit"
          options={PRESET_OPTIONS}
          value={preset}
          onChange={setPreset}
        />

        <Row justify="end">
          <Button type="submit" disabled={!canSubmit}>
            Start Sync
          </Button>
        </Row>
      </Stack>
    </form>
  );
}
