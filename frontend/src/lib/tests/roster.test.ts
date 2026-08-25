import { describe, expect, it } from "vitest";
import { affiliateTabValue, splitRosterForTabs } from "../roster";
import { playerFor, rosterEntryFor, teamFor } from "@/test-mocks";

describe("splitRosterForTabs", () => {
  const ahl = teamFor(3, "MRL");
  const echl = teamFor(4, "CIN");

  it("groups an entry under the affiliate it's currently on loan to", () => {
    const onLoan = rosterEntryFor({
      player: playerFor(1),
      assignment: { team: ahl, contract_level: "ahl", contract_level_inferred: false },
    });
    const onRoster = rosterEntryFor({ player: playerFor(2) });

    const result = splitRosterForTabs([onLoan, onRoster], [ahl, echl]);

    expect(result.roster).toEqual([onRoster]);
    expect(result.byAffiliate.find((group) => group.team.id === ahl.id)?.entries).toEqual([onLoan]);
    expect(result.byAffiliate.find((group) => group.team.id === echl.id)?.entries).toEqual([]);
  });

  it("puts a non-roster player in the non-roster bucket even if also on loan", () => {
    const entry = rosterEntryFor({
      player: playerFor(1),
      roster_status: { status: "non_roster", started_on: "2026-08-01" },
      assignment: { team: ahl, contract_level: "ahl", contract_level_inferred: false },
    });

    const result = splitRosterForTabs([entry], [ahl]);

    expect(result.nonRoster).toEqual([entry]);
    expect(result.byAffiliate[0].entries).toEqual([]);
  });

  it("falls back to the main roster for a loan to a team that's no longer a current affiliate", () => {
    const entry = rosterEntryFor({
      player: playerFor(1),
      assignment: {
        team: teamFor(5, "FORMER"),
        contract_level: "ahl",
        contract_level_inferred: false,
      },
    });

    const result = splitRosterForTabs([entry], [ahl]);

    expect(result.roster).toEqual([entry]);
  });
});

describe("affiliateTabValue", () => {
  it("namespaces a team id so it can't collide with a fixed tab value", () => {
    expect(affiliateTabValue(3)).toBe("affiliate:3");
  });
});
