import { useParams, useSearchParams } from "react-router";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { StandingsPanel } from "@/components/StandingsPanel/StandingsPanel";
import { Text } from "@/components/Text/Text";
import { ApiError } from "@/lib/apiClient";
import { formatFullDate } from "@/lib/format";
import { isStandingsView, type StandingsView } from "@/lib/standingsViews";
import { useStandings } from "@/models/useStandings";

function formatAsOf(date: string | null | undefined) {
  return date === null || date === undefined ? null : formatFullDate(date);
}

export function LeagueStandingsPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const standings = useStandings(slug ?? "");

  const view: StandingsView = isStandingsView(searchParams.get("view"))
    ? (searchParams.get("view") as StandingsView)
    : "league";

  function setView(next: StandingsView) {
    const params = new URLSearchParams(searchParams);
    if (next === "league") params.delete("view");
    else params.set("view", next);
    setSearchParams(params, { replace: true });
  }

  const missing = standings.error instanceof ApiError && standings.error.status === 404;
  const asOf = formatAsOf(standings.data?.meta?.as_of_date);

  return (
    <Stack gap="sm">
      <Row justify="between" align="baseline">
        <Text variant="subheading">Standings</Text>
        {standings.data === undefined ? null : (
          <Text variant="caption">
            {standings.data.meta?.season}
            {asOf === null ? "" : ` · as of ${asOf}`}
          </Text>
        )}
      </Row>

      {standings.isPending ? <Text tone="muted">Loading standings…</Text> : null}
      {missing ? (
        <Text tone="muted">No standings have been collected for this league yet.</Text>
      ) : null}
      {standings.isError && !missing ? <Text tone="danger">Could not load standings.</Text> : null}

      {standings.data === undefined ? null : (
        <StandingsPanel standings={standings.data.data} view={view} onViewChange={setView} />
      )}
    </Stack>
  );
}
