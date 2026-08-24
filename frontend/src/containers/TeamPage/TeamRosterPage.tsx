import { useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { Row } from "@/components/Row/Row";
import { RosterList, type RosterListSection } from "@/components/RosterList/RosterList";
import { RosterTransactionsPanel } from "@/components/RosterTransactionsPanel/RosterTransactionsPanel";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { useAuth } from "@/auth/useAuth";
import { isTeamGm } from "@/lib/membership";
import { groupRosterByPosition, splitRosterForTabs } from "@/lib/roster";
import { useTeamRoster } from "@/models/useTeamRoster";
import { useRosterTransactions } from "@/models/useRosterTransactions";
import { useSetRosterStatus } from "@/models/useSetRosterStatus";

const TAB_OPTIONS = [
  { value: "roster", label: "Roster" },
  { value: "non_roster", label: "Non-Roster" },
];

// A valid :id is guaranteed by TeamPage, which redirects before this ever renders.
export function TeamRosterPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const teamId = Number(id);

  const tab = searchParams.get("tab") === "non_roster" ? "non_roster" : "roster";
  const [transactionsPage, setTransactionsPage] = useState(1);
  const { user } = useAuth();
  const roster = useTeamRoster(teamId);
  const setStatus = useSetRosterStatus(teamId);
  const transactions = useRosterTransactions(teamId, roster.data?.meta?.season, transactionsPage);

  function selectTab(next: string) {
    setSearchParams(next === "roster" ? {} : { tab: next }, { replace: true });
  }

  if (roster.isPending) {
    return <Text tone="muted">Loading roster…</Text>;
  }

  if (roster.isError) {
    return <Text tone="danger">Could not load this team's roster.</Text>;
  }

  const { roster: rosterEntries, nonRoster } = splitRosterForTabs(roster.data.data);
  const sections: RosterListSection[] =
    tab === "non_roster"
      ? [{ key: "non-roster", label: null, entries: nonRoster }]
      : groupRosterByPosition(rosterEntries);

  return (
    <Stack gap="sm">
      <Row justify="between" align="baseline">
        <Text variant="heading" className="font-display tracking-wide">
          Roster
        </Text>
        <Text variant="caption" className="font-bold tracking-wide text-slate-400 uppercase">
          {roster.data.meta?.season} · {roster.data.data.length} players
        </Text>
      </Row>

      {roster.data.data.length === 0 ? (
        <Text tone="muted">No roster recorded for this season yet.</Text>
      ) : (
        <Stack gap="sm">
          <SegmentedControl
            options={TAB_OPTIONS}
            value={tab}
            onChange={selectTab}
            label="Roster view"
            themed
          />

          <div className="flex flex-col items-start gap-5 sm:flex-row">
            <div className="w-full min-w-0 flex-1">
              {sections.every((section) => section.entries.length === 0) ? (
                <Text tone="muted">
                  {tab === "non_roster"
                    ? "No players currently non-roster."
                    : "No players on file."}
                </Text>
              ) : (
                <RosterList
                  sections={sections}
                  canManageRoster={isTeamGm(user, teamId)}
                  onSetStatus={(playerId, status, effectiveOn) =>
                    setStatus.mutate({ playerId, status, effectiveOn })
                  }
                />
              )}
            </div>

            <RosterTransactionsPanel
              transactions={transactions.data?.data ?? []}
              meta={transactions.data?.meta}
              isLoading={transactions.isPending}
              onPageChange={setTransactionsPage}
            />
          </div>
        </Stack>
      )}
    </Stack>
  );
}
