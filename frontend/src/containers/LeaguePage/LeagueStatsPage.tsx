import { Link, useParams, useSearchParams } from "react-router";
import { Row } from "@/components/Row/Row";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { ServerDataTable, type CellRenderers } from "@/components/ServerDataTable/ServerDataTable";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";

type StatType = "skaters" | "goalies";

const RESOURCES: Record<StatType, string> = {
  skaters: "league_skaters",
  goalies: "league_goalies",
};

const TYPE_OPTIONS: { value: StatType; label: string }[] = [
  { value: "skaters", label: "Skaters" },
  { value: "goalies", label: "Goalies" },
];

// Params still meaningful after a skaters/goalies switch; sort, position and the
// advanced-split filters are not, and an invalid sort would 422.
const CARRIED_PARAMS = ["season", "team_id", "q"];

const PLAYER_CELLS: CellRenderers = {
  player: (value) => {
    const player = value as { id: number; first_name: string; last_name: string };
    return (
      <Link to={`/players/${player.id}`} className="hover:underline">
        {player.last_name}, {player.first_name}
      </Link>
    );
  },
  team: (value) => {
    if (value === null || value === undefined) return "—";
    if (value === "TOT") return "TOT";
    return (value as { abbreviation: string }).abbreviation;
  },
};

export function LeagueStatsPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const type: StatType = searchParams.get("type") === "goalies" ? "goalies" : "skaters";

  function setType(next: StatType) {
    const carried = new URLSearchParams();
    for (const key of CARRIED_PARAMS) {
      const value = searchParams.get(key);
      if (value) carried.set(key, value);
    }
    carried.set("type", next);
    setSearchParams(carried, { replace: true });
  }

  return (
    <Stack gap="lg">
      <Row justify="between" align="baseline" wrap>
        <Text variant="subheading">Stats</Text>
        <SegmentedControl
          label="Player type"
          options={TYPE_OPTIONS}
          value={type}
          onChange={setType}
        />
      </Row>

      <ServerDataTable
        key={type}
        resource={RESOURCES[type]}
        cellRenderers={PLAYER_CELLS}
        fixedParams={slug === undefined ? undefined : { league: slug }}
      />
    </Stack>
  );
}
