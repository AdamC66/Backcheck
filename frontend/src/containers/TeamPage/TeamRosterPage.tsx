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
import { affiliateTabValue, groupRosterByPosition, splitRosterForTabs } from "@/lib/roster";
import { useCallPlayerUp } from "@/models/useCallPlayerUp";
import { useTeamAffiliations } from "@/models/useTeamAffiliations";
import { useTeamRoster } from "@/models/useTeamRoster";
import { useRosterTransactions } from "@/models/useRosterTransactions";
import { useSendPlayerDown } from "@/models/useSendPlayerDown";
import { useSetRosterStatus } from "@/models/useSetRosterStatus";

// A valid :id is guaranteed by TeamPage, which redirects before this ever renders.
export function TeamRosterPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const teamId = Number(id);

  const [transactionsPage, setTransactionsPage] = useState(1);
  const { user } = useAuth();
  const roster = useTeamRoster(teamId);
  const setStatus = useSetRosterStatus(teamId);
  const affiliations = useTeamAffiliations(teamId);
  const affiliateTeams = (affiliations.data ?? []).map((affiliation) => affiliation.team);
  const sendDown = useSendPlayerDown(teamId);
  const callUp = useCallPlayerUp(teamId);
  const transactions = useRosterTransactions(teamId, roster.data?.meta?.season, transactionsPage);

  // One tab per current affiliate, labeled by its league (e.g. "AHL").
  const tabOptions = [
    { value: "roster", label: "Main Roster" },
    ...affiliateTeams.map((team) => ({
      value: affiliateTabValue(team.id),
      label: team.league?.abbreviation ?? team.abbreviation,
    })),
    { value: "non_roster", label: "Non-Roster" },
  ];
  const tabParam = searchParams.get("tab") ?? "roster";
  const tab = tabOptions.some((option) => option.value === tabParam) ? tabParam : "roster";

  function selectTab(next: string) {
    setSearchParams(next === "roster" ? {} : { tab: next }, { replace: true });
  }

  if (roster.isPending) {
    return <Text tone="muted">Loading roster…</Text>;
  }

  if (roster.isError) {
    return <Text tone="danger">Could not load this team's roster.</Text>;
  }

  const {
    roster: rosterEntries,
    nonRoster,
    byAffiliate,
  } = splitRosterForTabs(roster.data.data, affiliateTeams);
  const affiliateGroup = byAffiliate.find((group) => affiliateTabValue(group.team.id) === tab);

  const sections: RosterListSection[] =
    tab === "non_roster"
      ? [{ key: "non-roster", label: null, entries: nonRoster }]
      : affiliateGroup
        ? [
            {
              key: `affiliate-${affiliateGroup.team.id}`,
              label: null,
              entries: affiliateGroup.entries,
            },
          ]
        : groupRosterByPosition(rosterEntries);

  const emptyStateMessage = (() => {
    if (tab === "non_roster") return "No players currently non-roster.";
    if (affiliateGroup) return `No players currently loaned to ${affiliateGroup.team.name}.`;

    return "No players on file.";
  })();

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
            options={tabOptions}
            value={tab}
            onChange={selectTab}
            label="Roster view"
            themed
          />

          <div className="flex flex-col items-start gap-5 sm:flex-row">
            <div className="w-full min-w-0 flex-1">
              {sections.every((section) => section.entries.length === 0) ? (
                <Text tone="muted">{emptyStateMessage}</Text>
              ) : (
                <RosterList
                  sections={sections}
                  canManageRoster={isTeamGm(user, teamId)}
                  affiliateTeams={affiliateTeams}
                  onSetStatus={(playerId, status, effectiveOn) =>
                    setStatus.mutate({ playerId, status, effectiveOn })
                  }
                  onSendDown={(playerId, destinationTeamId) =>
                    sendDown.mutate({ playerId, destinationTeamId })
                  }
                  onCallUp={(playerId) => callUp.mutate({ playerId })}
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
