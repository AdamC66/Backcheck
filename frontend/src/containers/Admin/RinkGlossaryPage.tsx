import { Card } from "@/components/Card/Card";
import { DangerZonesOverlay } from "@/components/DangerZonesOverlay/DangerZonesOverlay";
import { Rink } from "@/components/Rink/Rink";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { ZoneShotChart } from "@/components/ZoneShotChart/ZoneShotChart";
import { useDangerZones } from "@/models/useDangerZones";

const EXAMPLE_COUNTS = { highDanger: 163, midRange: 166, longRange: 47 };

export function RinkGlossaryPage() {
  const dangerZones = useDangerZones();

  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <Text variant="subheading">Shot danger zones</Text>
        <Text tone="muted">
          The “home plate” shot-danger definition (Elias / War-on-Ice, as used by Natural Stat Trick
          and MoneyPuck), translated to our rink coordinates. Every heatmap and zone chart buckets
          shots against these boundaries.
        </Text>
      </Stack>

      {dangerZones.isPending ? <Text tone="muted">Loading…</Text> : null}
      {dangerZones.isError ? (
        <Text tone="danger">Could not load the danger-zone geometry.</Text>
      ) : null}

      {dangerZones.data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card padding="lg">
            <Stack gap="md">
              <Text variant="title">The boundaries</Text>
              <Rink className="w-full">
                <DangerZonesOverlay geometry={dangerZones.data} />
              </Rink>
              <Stack gap="xs">
                <Text variant="caption">
                  <strong>High danger</strong> — inside the home-plate polygon (top of the faceoff
                  circles → the dots → the crease corners), or within{" "}
                  {dangerZones.data.high_danger_crease_radius_ft} ft of the net at any angle.
                </Text>
                <Text variant="caption">
                  <strong>Mid-range</strong> — outside the polygon but within{" "}
                  {dangerZones.data.mid_range_max_distance_ft} ft of the net.
                </Text>
                <Text variant="caption">
                  <strong>Long range</strong> — everything beyond that.
                </Text>
              </Stack>
            </Stack>
          </Card>

          <Card padding="lg">
            <Stack gap="md">
              <Text variant="title">As a zone chart</Text>
              <ZoneShotChart
                geometry={dangerZones.data}
                counts={EXAMPLE_COUNTS}
                caption="Example: shot count per zone"
              />
              <Text variant="caption" tone="muted">
                The number is the raw shot count; the shade is per-area rate, so a small hot zone
                reads darker than a large zone with a similar count. Example figures — real data
                lands with the team and skater analytics pages.
              </Text>
            </Stack>
          </Card>
        </div>
      ) : null}
    </Stack>
  );
}
