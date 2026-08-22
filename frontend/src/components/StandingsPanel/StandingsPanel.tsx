import { Card } from "@/components/Card/Card";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { Stack } from "@/components/Stack/Stack";
import { StandingsTable } from "@/components/StandingsTable/StandingsTable";
import { Text } from "@/components/Text/Text";
import {
  STANDINGS_VIEWS,
  standingsSections,
  supportsView,
  type StandingsView,
} from "@/lib/standingsViews";
import type { Standing } from "@/models/standings";

const VIEW_LABELS: Record<StandingsView, string> = {
  league: "League",
  conference: "Conference",
  division: "Division",
  wildcard: "Wild Card",
};

export interface StandingsPanelProps {
  standings: Standing[];
  view: StandingsView;
  onViewChange: (view: StandingsView) => void;
}

export function StandingsPanel({ standings, view, onViewChange }: StandingsPanelProps) {
  const options = STANDINGS_VIEWS.map((value) => ({
    value,
    label: VIEW_LABELS[value],
    disabled: !supportsView(standings, value),
  }));

  const sections = standingsSections(standings, view);

  return (
    <Stack gap="sm">
      <SegmentedControl
        options={options}
        value={view}
        onChange={onViewChange}
        label="Standings view"
      />

      {/* Scrolls here, not the page, so the view control stays reachable. */}
      <Stack gap="md" className="lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-1">
        {sections.map((section) => (
          <Stack key={section.key} gap="xs">
            {section.title === null ? null : <Text variant="label">{section.title}</Text>}

            <Card padding="none">
              {section.groups.map((group) => (
                <div key={group.key} className="border-b border-slate-200 last:border-0">
                  {group.title === null ? null : (
                    <div className="bg-slate-50 px-3 py-1.5">
                      <Text variant="caption">{group.title}</Text>
                    </div>
                  )}

                  <StandingsTable
                    standings={group.standings}
                    rankKey={group.rankKey}
                    rankPrefix={group.rankPrefix}
                    cutlineAfter={group.cutlineAfter}
                  />
                </div>
              ))}
            </Card>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
