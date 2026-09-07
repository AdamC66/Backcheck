import { useState } from "react";
import { GameZoneShareBar } from "@/components/GameZoneShareBar/GameZoneShareBar";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { ShotScatter } from "@/components/ShotScatter/ShotScatter";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { ZoneOccupancyStrip } from "@/components/ZoneOccupancyStrip/ZoneOccupancyStrip";
import { ZoneTimeTable } from "@/components/ZoneTimeTable/ZoneTimeTable";
import { bySide, useGameContext } from "@/containers/GamePage/gameContext";
import { useGameShots } from "@/models/useGameShots";

type ShotFilter = "all" | "home" | "away";

export function GameChartsPage() {
  const { detail } = useGameContext();
  const { game, zone_time: zoneTime } = detail;
  const shots = useGameShots(game.id);
  const [shotFilter, setShotFilter] = useState<ShotFilter>("all");

  const filterOptions: { value: ShotFilter; label: string }[] = [
    { value: "all", label: "Both" },
    { value: "home", label: game.home.team.abbreviation },
    { value: "away", label: game.away.team.abbreviation },
  ];

  const allShots = shots.data?.data ?? [];
  const visibleShots =
    shotFilter === "all" ? allShots : allShots.filter((shot) => shot.team_side === shotFilter);

  return (
    <Stack gap="lg">
      <Stack gap="sm">
        <SectionHeading
          aside={
            allShots.length > 0 ? (
              <SegmentedControl
                options={filterOptions}
                value={shotFilter}
                onChange={setShotFilter}
                label="Shot team filter"
              />
            ) : undefined
          }
        >
          Shot Map
        </SectionHeading>
        {shots.isError ? (
          <Text tone="danger">Could not load shot locations.</Text>
        ) : shots.isPending ? (
          <Text tone="muted">Loading shots…</Text>
        ) : allShots.length === 0 ? (
          <Text tone="muted">No located shots for this game.</Text>
        ) : (
          <ShotScatter
            shots={visibleShots}
            homeLabel={game.home.team.abbreviation}
            awayLabel={game.away.team.abbreviation}
            homeColor={game.home.team.primary_color}
            awayColor={game.away.team.primary_color}
            unlocatedCount={shots.data?.meta?.unlocated_count}
          />
        )}
      </Stack>

      {zoneTime.periods.length === 0 ? null : (
        <>
          <Stack gap="sm">
            <SectionHeading>Zone Time Share</SectionHeading>
            <GameZoneShareBar
              rows={[
                {
                  label: game.away.team.abbreviation,
                  offensiveSeconds: zoneTime.totals.defensive_seconds,
                  neutralSeconds: zoneTime.totals.neutral_seconds,
                  defensiveSeconds: zoneTime.totals.offensive_seconds,
                },
                {
                  label: game.home.team.abbreviation,
                  offensiveSeconds: zoneTime.totals.offensive_seconds,
                  neutralSeconds: zoneTime.totals.neutral_seconds,
                  defensiveSeconds: zoneTime.totals.defensive_seconds,
                },
              ]}
            />
          </Stack>

          <Stack gap="sm">
            <SectionHeading>Zone Occupancy by Period</SectionHeading>
            <ZoneOccupancyStrip
              periods={zoneTime.periods}
              homeAbbreviation={game.home.team.abbreviation}
            />
          </Stack>

          {zoneTime.skaters.length === 0 ? null : (
            <Stack gap="lg">
              <Stack gap="sm">
                <SectionHeading>{game.away.team.name} — Skater Zone Time</SectionHeading>
                <ZoneTimeTable skaters={bySide(zoneTime.skaters, game.away.team.id)} />
              </Stack>
              <Stack gap="sm">
                <SectionHeading>{game.home.team.name} — Skater Zone Time</SectionHeading>
                <ZoneTimeTable skaters={bySide(zoneTime.skaters, game.home.team.id)} />
              </Stack>
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
