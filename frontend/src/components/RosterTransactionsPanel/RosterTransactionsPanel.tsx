import { Pager } from "@/components/Pager/Pager";
import { RosterStatusBadge } from "@/components/RosterStatusBadge/RosterStatusBadge";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { formatMonthDay } from "@/lib/format";
import type { RosterTransaction, RosterTransactionsMeta } from "@/models/rosterTransactions";

export interface RosterTransactionsPanelProps {
  transactions: RosterTransaction[];
  meta: RosterTransactionsMeta | undefined;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function RosterTransactionsPanel({
  transactions,
  meta,
  isLoading,
  onPageChange,
}: RosterTransactionsPanelProps) {
  return (
    <Stack gap="xs" className="w-full shrink-0 sm:w-72">
      <Text variant="label" className="font-display uppercase tracking-wide">
        Transactions
      </Text>

      {isLoading ? (
        <Text tone="muted">Loading…</Text>
      ) : transactions.length === 0 ? (
        <Text tone="muted">No moves recorded this season.</Text>
      ) : (
        <ul className="border border-slate-200">
          {transactions.map((entry) => (
            <li
              key={`${entry.player_id}-${entry.started_on}`}
              className="border-b border-slate-100 px-3 py-2 last:border-0"
            >
              <Row justify="between" align="start">
                <Text variant="title">{entry.player_name}</Text>
                <RosterStatusBadge status={entry.status} />
              </Row>
              <Text variant="caption" tone="muted">
                {formatMonthDay(entry.started_on)} –{" "}
                {entry.ended_on === null ? "ongoing" : formatMonthDay(entry.ended_on)}
              </Text>
            </li>
          ))}
        </ul>
      )}

      {meta ? (
        <Pager page={meta.page} totalPages={meta.total_pages} onPageChange={onPageChange} />
      ) : null}
    </Stack>
  );
}
