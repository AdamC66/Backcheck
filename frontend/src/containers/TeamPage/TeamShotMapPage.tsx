import { useParams, useSearchParams } from "react-router";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { Select } from "@/components/Select/Select";
import { ShotDensityMap } from "@/components/ShotDensityMap/ShotDensityMap";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import type { GameType } from "@/models/games";
import type { ShotStrengthState, TeamShotLocation } from "@/models/teamShotLocations";
import { useSeasons } from "@/models/useSeasons";
import { useTeam } from "@/models/useTeam";
import { useTeamShotLocations } from "@/models/useTeamShotLocations";

const TYPE_OPTIONS: { value: GameType; label: string }[] = [
  { value: "regular_season", label: "Regular season" },
  { value: "playoffs", label: "Playoffs" },
];

const atStrength = (shots: TeamShotLocation[], strength: ShotStrengthState) =>
  shots.filter((shot) => shot.strength_state === strength);

// A valid :id is guaranteed by TeamPage, which redirects before this ever renders.
export function TeamShotMapPage() {
  const { id } = useParams();
  const teamId = Number(id);
  const [searchParams, setSearchParams] = useSearchParams();

  const gameType: GameType =
    searchParams.get("game_type") === "playoffs" ? "playoffs" : "regular_season";
  const team = useTeam(teamId);
  const seasons = useSeasons(team.data?.league?.slug ?? null);
  const shots = useTeamShotLocations(teamId, {
    season: searchParams.get("season") ?? undefined,
    gameType,
  });
  const resolvedSeason = shots.data?.meta?.season;

  function patchParams(next: Record<string, string | null>) {
    const merged = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === null) merged.delete(key);
      else merged.set(key, value);
    }
    setSearchParams(merged, { replace: true });
  }

  const forShots = shots.data?.data.for ?? [];
  const againstShots = shots.data?.data.against ?? [];
  const unlocatedFor = shots.data?.meta?.unlocated_for;
  const unlocatedAgainst = shots.data?.meta?.unlocated_against;

  const panels = [
    {
      caption: "Offense · 5v5",
      shots: atStrength(forShots, "even_strength"),
      unlocated: unlocatedFor,
    },
    {
      caption: "Offense · Power play",
      shots: atStrength(forShots, "power_play"),
      unlocated: undefined,
    },
    {
      caption: "Defense · 5v5",
      shots: atStrength(againstShots, "even_strength"),
      unlocated: unlocatedAgainst,
    },
    {
      caption: "Defense · Penalty kill",
      shots: atStrength(againstShots, "power_play"),
      unlocated: undefined,
    },
  ];

  return (
    <Stack gap="lg">
      <Row justify="between" align="baseline" wrap>
        <Text variant="heading" className="font-display tracking-wide">
          Shot Map
        </Text>
        <Row gap="sm" wrap align="end">
          {seasons.data && seasons.data.length > 0 ? (
            <Select
              id="shot-map-season"
              label="Season"
              value={resolvedSeason ?? ""}
              onChange={(event) => patchParams({ season: event.target.value })}
              options={seasons.data.map((season) => ({ value: season.label, label: season.label }))}
              className="max-w-40"
            />
          ) : null}
          <SegmentedControl
            options={TYPE_OPTIONS}
            value={gameType}
            onChange={(next) => patchParams({ game_type: next === "regular_season" ? null : next })}
            label="Game type"
            themed
          />
        </Row>
      </Row>

      {shots.isPending ? (
        <Text tone="muted">Loading shots…</Text>
      ) : shots.isError ? (
        <Text tone="danger">Could not load shot locations.</Text>
      ) : forShots.length === 0 && againstShots.length === 0 ? (
        <Text tone="muted">No located shots for this season yet.</Text>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {panels.map((panel) => (
            <Stack key={panel.caption} gap="sm">
              <SectionHeading>{panel.caption}</SectionHeading>
              <ShotDensityMap
                shots={panel.shots}
                caption={panel.caption}
                unlocatedCount={panel.unlocated}
              />
            </Stack>
          ))}
        </div>
      )}
    </Stack>
  );
}
