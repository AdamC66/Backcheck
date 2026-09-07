import { GameZoneShareBar } from "@/components/GameZoneShareBar/GameZoneShareBar";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { ZoneOccupancyStrip } from "@/components/ZoneOccupancyStrip/ZoneOccupancyStrip";
import { ZoneTimeTable } from "@/components/ZoneTimeTable/ZoneTimeTable";
import { bySide, useGameContext } from "@/containers/GamePage/gameContext";

export function GameChartsPage() {
  const { detail } = useGameContext();
  const { game, zone_time: zoneTime } = detail;

  if (zoneTime.periods.length === 0) {
    return <Text tone="muted">No zone data for this game yet.</Text>;
  }

  // totals are in the home team's frame, so the away team's split is the mirror.
  const awaySkaters = bySide(zoneTime.skaters, game.away.team.id);
  const homeSkaters = bySide(zoneTime.skaters, game.home.team.id);

  return (
    <Stack gap="lg">
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
            <ZoneTimeTable skaters={awaySkaters} />
          </Stack>
          <Stack gap="sm">
            <SectionHeading>{game.home.team.name} — Skater Zone Time</SectionHeading>
            <ZoneTimeTable skaters={homeSkaters} />
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
