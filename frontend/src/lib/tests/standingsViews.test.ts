import { describe, expect, it } from "vitest";
import { standingFor, teamFor } from "@/test-mocks";
import { isStandingsView, standingsSections, supportsView } from "../standingsViews";

// Two conferences, two divisions each, three teams per division: enough that the top
// three of a division and the wildcard chasers are distinguishable.
const LEAGUE = [
  ["Eastern", "Atlantic", "BUF", 1, 1, 0],
  ["Eastern", "Atlantic", "TBL", 2, 3, 0],
  ["Eastern", "Atlantic", "OTT", 3, 5, 1],
  ["Eastern", "Metropolitan", "CAR", 1, 2, 0],
  ["Eastern", "Metropolitan", "PIT", 2, 4, 0],
  ["Eastern", "Metropolitan", "WSH", 3, 6, 2],
  ["Western", "Central", "COL", 1, 1, 0],
  ["Western", "Central", "DAL", 2, 2, 3],
  ["Western", "Pacific", "VGK", 1, 3, 0],
].map(([conference, division, abbrev, divisionSequence, conferenceSequence, wildcard], index) =>
  standingFor(teamFor(index + 1, abbrev as string), {
    conference_name: conference as string,
    division_name: division as string,
    division_sequence: divisionSequence as number,
    conference_sequence: conferenceSequence as number,
    wildcard_sequence: wildcard as number,
    league_sequence: index + 1,
  }),
);

function abbrevs(standings: { team: { abbreviation: string } }[]) {
  return standings.map((standing) => standing.team.abbreviation);
}

describe("standingsSections", () => {
  it("returns one flat group for the league view, ranked by league sequence", () => {
    const [section] = standingsSections(LEAGUE, "league");

    expect(section.groups).toHaveLength(1);
    expect(section.groups[0].rankKey).toBe("league_sequence");
    expect(abbrevs(section.groups[0].standings)).toEqual([
      "BUF",
      "TBL",
      "OTT",
      "CAR",
      "PIT",
      "WSH",
      "COL",
      "DAL",
      "VGK",
    ]);
  });

  it("splits the conference view by conference, ranked within it", () => {
    const sections = standingsSections(LEAGUE, "conference");

    expect(sections.map((section) => section.title)).toEqual(["Eastern", "Western"]);
    expect(abbrevs(sections[0].groups[0].standings)).toEqual([
      "BUF",
      "CAR",
      "TBL",
      "PIT",
      "OTT",
      "WSH",
    ]);
  });

  it("splits the division view by division, ranked within it", () => {
    const sections = standingsSections(LEAGUE, "division");

    expect(sections.map((section) => section.title)).toEqual([
      "Atlantic",
      "Metropolitan",
      "Central",
      "Pacific",
    ]);
    expect(abbrevs(sections[0].groups[0].standings)).toEqual(["BUF", "TBL", "OTT"]);
  });

  describe("the wildcard view", () => {
    const [eastern] = standingsSections(LEAGUE, "wildcard");

    it("gives each conference its divisions' qualifiers, then the chasers", () => {
      expect(eastern.title).toBe("Eastern");
      expect(eastern.groups.map((group) => group.title)).toEqual([
        "Atlantic",
        "Metropolitan",
        "Wild Card",
      ]);
    });

    it("keeps only teams holding a division spot in the division groups", () => {
      expect(abbrevs(eastern.groups[0].standings)).toEqual(["BUF", "TBL"]);
      expect(abbrevs(eastern.groups[1].standings)).toEqual(["CAR", "PIT"]);
    });

    it("ranks the chasers by wildcard sequence and labels them WC", () => {
      const wildcard = eastern.groups[2];

      expect(abbrevs(wildcard.standings)).toEqual(["OTT", "WSH"]);
      expect(wildcard.rankPrefix).toBe("WC");
      expect(wildcard.rankKey).toBe("wildcard_sequence");
    });

    it("draws no cut line when nobody is chasing from outside the top two", () => {
      expect(eastern.groups[2].cutlineAfter).toBeUndefined();
    });

    it("draws the cut line after the second wildcard spot once there are chasers", () => {
      const chased = [
        ...LEAGUE,
        standingFor(teamFor(99, "NYR"), {
          conference_name: "Eastern",
          division_name: "Metropolitan",
          wildcard_sequence: 3,
        }),
      ];
      const [conference] = standingsSections(chased, "wildcard");

      expect(conference.groups[2].cutlineAfter).toBe(1);
      expect(abbrevs(conference.groups[2].standings)).toEqual(["OTT", "WSH", "NYR"]);
    });
  });
});

describe("supportsView", () => {
  it("rejects grouped views when the season has no conferences", () => {
    const flat = [standingFor(teamFor(1, "MTL"), { conference_name: null, division_name: null })];

    expect(supportsView(flat, "league")).toBe(true);
    expect(supportsView(flat, "conference")).toBe(false);
    expect(supportsView(flat, "division")).toBe(false);
    expect(supportsView(flat, "wildcard")).toBe(false);
  });

  it("rejects every view when there are no standings at all", () => {
    expect(supportsView([], "league")).toBe(false);
    expect(supportsView([], "wildcard")).toBe(false);
  });
});

describe("isStandingsView", () => {
  it("accepts known views and rejects anything else", () => {
    expect(isStandingsView("wildcard")).toBe(true);
    expect(isStandingsView("nonsense")).toBe(false);
    expect(isStandingsView(null)).toBe(false);
  });
});
