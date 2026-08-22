import type { Envelope } from "@/lib/apiClient";
import type { User } from "@/models/auth";
import type { League, LeagueWithTeams } from "@/models/leagues";
import type { Standing, StandingsMeta } from "@/models/standings";
import type { Team } from "@/models/teams";

// Shared fixtures so test files assert against one definition of "a user" rather
// than each inventing its own shape.
export const SUPER_ADMIN: User = {
  id: 1,
  email: "admin@example.com",
  is_super_admin: true,
};

export const TEAM_USER: User = {
  id: 2,
  email: "gm@example.com",
  is_super_admin: false,
};

export const LEAGUES: League[] = [
  {
    id: 1,
    name: "National Hockey League",
    slug: "nhl",
    abbreviation: "NHL",
    tier: 1,
    logo_url: "http://localhost:3000/rails/active_storage/blobs/proxy/nhl/NHL.svg",
  },
  {
    id: 2,
    name: "American Hockey League",
    slug: "ahl",
    abbreviation: "AHL",
    tier: 2,
    logo_url: "http://localhost:3000/rails/active_storage/blobs/proxy/ahl/AHL.svg",
  },
  {
    id: 3,
    name: "ECHL",
    slug: "echl",
    abbreviation: "ECHL",
    tier: 3,
    logo_url: "http://localhost:3000/rails/active_storage/blobs/proxy/echl/ECHL.svg",
  },
];

export const TEAMS: Team[] = [
  {
    id: 1,
    name: "Anaheim Ducks",
    abbreviation: "ANA",
    logo_url: "http://localhost:3000/rails/active_storage/blobs/proxy/ana/anaheim.png",
    primary_color: "#F47A38",
    secondary_color: "#B9975B",
    tertiary_color: "#C1C6C8",
  },
  {
    id: 2,
    name: "Boston Bruins",
    abbreviation: "BOS",
    logo_url: null,
    primary_color: null,
    secondary_color: null,
    tertiary_color: null,
  },
];

export const LEAGUE_WITH_TEAMS: LeagueWithTeams = { ...LEAGUES[0], teams: TEAMS };

function standingFor(team: Team, overrides: Partial<Standing>): Standing {
  return {
    team,
    as_of_date: "2026-04-17",
    games_played: 82,
    wins: 50,
    losses: 25,
    ot_losses: 7,
    points: 107,
    point_pctg: 0.65244,
    goals_for: 280,
    goals_against: 230,
    goal_differential: 50,
    regulation_wins: 44,
    regulation_plus_ot_wins: 48,
    streak_code: "W",
    streak_count: 3,
    conference_name: "Western",
    conference_sequence: 1,
    division_name: "Central",
    division_sequence: 1,
    league_sequence: 1,
    wildcard_sequence: 0,
    home_record: { wins: 26, losses: 9, ot_losses: 6 },
    road_record: { wins: 24, losses: 16, ot_losses: 1 },
    l10_record: { wins: 7, losses: 2, ot_losses: 1 },
    ...overrides,
  };
}

export const STANDINGS: Envelope<Standing[], StandingsMeta> = {
  data: [
    standingFor(TEAMS[0], { league_sequence: 1, points: 121, goal_differential: 99 }),
    standingFor(TEAMS[1], {
      league_sequence: 2,
      points: 78,
      goal_differential: -46,
      streak_code: "L",
      streak_count: 1,
    }),
  ],
  meta: { season: "2025-26", as_of_date: "2026-04-17" },
};
