import type { Envelope } from "@/lib/apiClient";
import type { User } from "@/models/auth";
import type { Game, GamesMeta } from "@/models/games";
import type { League, LeagueWithTeams } from "@/models/leagues";
import type { RosterEntry, RosterMeta, RosterPlayer } from "@/models/roster";
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

export function teamFor(id: number, abbreviation: string): Team {
  return {
    id,
    name: `${abbreviation} Club`,
    abbreviation,
    nhl_team_id: id,
    logo_url: null,
    primary_color: null,
    secondary_color: null,
    tertiary_color: null,
  };
}

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
    nhl_team_id: 24,
    logo_url: "http://localhost:3000/rails/active_storage/blobs/proxy/ana/anaheim.png",
    primary_color: "#F47A38",
    secondary_color: "#B9975B",
    tertiary_color: "#C1C6C8",
  },
  {
    id: 2,
    name: "Boston Bruins",
    abbreviation: "BOS",
    nhl_team_id: 6,
    logo_url: null,
    primary_color: null,
    secondary_color: null,
    tertiary_color: null,
  },
];

export const LEAGUE_WITH_TEAMS: LeagueWithTeams = { ...LEAGUES[0], teams: TEAMS };

export const TEAM_WITH_LEAGUE: Team = { ...TEAMS[0], league: LEAGUES[0] };

// Exported so grouping tests can build a whole league without redefining the shape.
export function standingFor(team: Team, overrides: Partial<Standing> = {}): Standing {
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

export function gameFor(overrides: Partial<Game> = {}): Game {
  return {
    id: 1,
    nhl_game_id: 2025020004,
    game_type: "regular_season",
    game_date: "2025-10-08",
    starts_at: "2025-10-08T23:00:00Z",
    venue: "Scotiabank Arena",
    neutral_site: false,
    state: "OFF",
    last_period_type: "REG",
    home: { team: TEAMS[0], score: 5 },
    away: { team: TEAMS[1], score: 2 },
    ...overrides,
  };
}

export const LEAGUE_GAMES: Envelope<Game[], GamesMeta> = {
  data: [
    gameFor({ id: 10, game_date: "2026-04-15", state: "OFF", last_period_type: "SO" }),
    gameFor({
      id: 11,
      game_date: "2026-04-15",
      state: "FUT",
      last_period_type: null,
      home: { team: TEAMS[1], score: null },
      away: { team: TEAMS[0], score: null },
    }),
  ],
  meta: {
    from: "2026-04-15",
    to: "2026-04-15",
    count: 2,
    dates: ["2026-04-15"],
    prev_cursor: "2026-04-14",
    next_cursor: "2026-04-16",
  },
};

export const TEAM_GAMES: Envelope<Game[], GamesMeta> = {
  data: [
    gameFor({ id: 1, game_date: "2025-10-08" }),
    gameFor({
      id: 2,
      game_date: "2025-11-02",
      last_period_type: "OT",
      home: { team: TEAMS[1], score: 4 },
      away: { team: TEAMS[0], score: 3 },
    }),
  ],
  meta: { season: "2025-26", from: "2025-10-08", to: "2025-11-02", count: 2 },
};

export function playerFor(id: number, overrides: Partial<RosterPlayer> = {}): RosterPlayer {
  return {
    id,
    first_name: "Test",
    last_name: `Player${id}`,
    position: "center",
    shoots_catches: "L",
    height_in_inches: 72,
    weight_in_pounds: 190,
    birth_date: "2000-01-01",
    birth_city: "Toronto",
    birth_country: "CAN",
    headshot_url: null,
    draft: null,
    ...overrides,
  };
}

export function rosterEntryFor(overrides: Partial<RosterEntry> = {}): RosterEntry {
  return {
    player: playerFor(1),
    jersey_number: 34,
    contract_level: "nhl",
    assignment: null,
    ...overrides,
  };
}

export const TEAM_ROSTER: Envelope<RosterEntry[], RosterMeta> = {
  data: [
    rosterEntryFor({
      player: playerFor(1, { first_name: "Auston", last_name: "Matthews", position: "center" }),
      jersey_number: 34,
    }),
    rosterEntryFor({
      player: playerFor(2, { first_name: "Morgan", last_name: "Rielly", position: "defense" }),
      jersey_number: 44,
    }),
    rosterEntryFor({
      player: playerFor(3, { first_name: "Easton", last_name: "Cowan", position: "left_wing" }),
      jersey_number: 53,
      assignment: {
        team: teamFor(3, "MRL"),
        contract_level: "ahl",
        contract_level_inferred: false,
      },
    }),
  ],
  meta: { season: "2025-26", count: 3 },
};
