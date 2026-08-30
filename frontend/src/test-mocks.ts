import type { Envelope } from "@/lib/apiClient";
import type { User } from "@/models/auth";
import type { DangerZoneGeometry } from "@/models/dangerZones";
import type {
  GameDetail,
  GameDetailMeta,
  GoalieGameStat,
  PlayerGameAdvancedStat,
  SkaterGameStat,
  TeamGameAdvancedStat,
} from "@/models/gameDetail";
import type { Game, GamesMeta } from "@/models/games";
import type { League, LeagueWithTeams } from "@/models/leagues";
import type {
  PlayerAdvancedSeason,
  PlayerDetail,
  PlayerDetailMeta,
  PlayerGoalieSeason,
  PlayerSkaterSeason,
} from "@/models/playerDetail";
import type { RosterEntry, RosterMeta, RosterPlayer } from "@/models/roster";
import type { RosterTransaction, RosterTransactionsMeta } from "@/models/rosterTransactions";
import type { Season } from "@/models/seasons";
import type { Standing, StandingsMeta } from "@/models/standings";
import type { TeamAffiliation } from "@/models/teamAffiliations";
import type { Team } from "@/models/teams";
import type {
  GoalieSeasonStat,
  PlayerSeasonAdvancedStat,
  SkaterSeasonStat,
  TeamSeasonAdvancedStat,
  TeamStats,
  TeamStatsMeta,
} from "@/models/teamStats";

// Shared fixtures so test files assert against one definition of "a user" rather
// than each inventing its own shape.
export const SUPER_ADMIN: User = {
  id: 1,
  email: "admin@example.com",
  is_super_admin: true,
  memberships: [],
};

// A gm Membership on TEAMS[0] — useful anywhere a test needs a real, non-admin GM.
export const TEAM_USER: User = {
  id: 2,
  email: "gm@example.com",
  is_super_admin: false,
  memberships: [
    { role: "gm", scope_type: "team", scopeable_id: 1, scopeable_name: "Anaheim Ducks" },
  ],
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

export function skaterGameStatFor(overrides: Partial<SkaterGameStat> = {}): SkaterGameStat {
  return {
    player: playerFor(1),
    team_id: TEAMS[0].id,
    goals: 1,
    assists: 1,
    points: 2,
    plus_minus: 1,
    pim: 2,
    hits: 3,
    power_play_goals: 0,
    shots_on_goal: 4,
    faceoff_winning_pctg: null,
    time_on_ice_seconds: 1236,
    shifts: 22,
    blocked_shots: 1,
    giveaways: 2,
    takeaways: 1,
    faceoff_wins: 5,
    faceoff_losses: 3,
    shots_attempted: 6,
    missed_shots: 2,
    shots_blocked_against: 1,
    ...overrides,
  };
}

export function goalieGameStatFor(overrides: Partial<GoalieGameStat> = {}): GoalieGameStat {
  return {
    player: playerFor(2),
    team_id: TEAMS[0].id,
    even_strength_shots_against: 25,
    even_strength_goals_against: 2,
    power_play_shots_against: 5,
    power_play_goals_against: 1,
    shorthanded_shots_against: 1,
    shorthanded_goals_against: 0,
    shots_against: 31,
    saves: 28,
    goals_against: 3,
    save_pctg: 0.9032,
    pim: 0,
    time_on_ice_seconds: 3600,
    starter: true,
    decision: "W",
    ...overrides,
  };
}

export function playerGameAdvancedStatFor(
  overrides: Partial<PlayerGameAdvancedStat> = {},
): PlayerGameAdvancedStat {
  return {
    player: playerFor(1),
    team_id: TEAMS[0].id,
    strength_state: "all",
    score_state: "all",
    corsi_for: 12,
    corsi_against: 8,
    fenwick_for: 9,
    fenwick_against: 6,
    xg_for: 0.85,
    xg_against: 0.42,
    zone_entries: 0,
    zone_exits: 0,
    toi_seconds: 1080,
    ...overrides,
  };
}

export function teamGameAdvancedStatFor(
  overrides: Partial<TeamGameAdvancedStat> = {},
): TeamGameAdvancedStat {
  return {
    team_id: TEAMS[0].id,
    strength_state: "all",
    score_state: "all",
    corsi_for: 58,
    corsi_against: 42,
    fenwick_for: 45,
    fenwick_against: 33,
    xg_for: 2.85,
    xg_against: 2.1,
    faceoff_wins: 30,
    faceoff_losses: 25,
    pdo: 100.9,
    toi_seconds: 3600,
    ...overrides,
  };
}

export const GAME_DETAIL: Envelope<GameDetail, GameDetailMeta> = {
  data: {
    game: gameFor(),
    skaters: [
      skaterGameStatFor({
        player: playerFor(1, { first_name: "Auston", last_name: "Matthews" }),
        team_id: TEAMS[0].id,
        goals: 2,
      }),
      skaterGameStatFor({
        player: playerFor(2, { first_name: "William", last_name: "Nylander" }),
        team_id: TEAMS[1].id,
      }),
    ],
    goalies: [
      goalieGameStatFor({
        player: playerFor(3, { first_name: "Anthony", last_name: "Stolarz" }),
        team_id: TEAMS[0].id,
      }),
    ],
    advanced: {
      players: [
        playerGameAdvancedStatFor({
          player: playerFor(1, { first_name: "Auston", last_name: "Matthews" }),
          team_id: TEAMS[0].id,
        }),
      ],
      teams: [
        teamGameAdvancedStatFor({ team_id: TEAMS[0].id }),
        teamGameAdvancedStatFor({ team_id: TEAMS[1].id, corsi_for: 42, corsi_against: 58 }),
      ],
    },
  },
  meta: {},
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
    roster_status: { status: "active", started_on: null },
    ...overrides,
  };
}

export function rosterTransactionFor(
  overrides: Partial<RosterTransaction> = {},
): RosterTransaction {
  return {
    player_id: 1,
    player_name: "Test Player1",
    team_id: 1,
    team_name: "Test Team",
    season: "2025-26",
    status: "injured_reserve",
    started_on: "2026-08-10",
    ended_on: null,
    ...overrides,
  };
}

export const ROSTER_TRANSACTIONS: Envelope<RosterTransaction[], RosterTransactionsMeta> = {
  data: [rosterTransactionFor()],
  meta: { page: 1, per_page: 25, total_count: 1, total_pages: 1 },
};

export function teamAffiliationFor(id: number, team: Team): TeamAffiliation {
  return { id, team };
}

export const TEAM_AFFILIATIONS: TeamAffiliation[] = [teamAffiliationFor(1, teamFor(3, "MRL"))];

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

export function skaterSeasonStatFor(overrides: Partial<SkaterSeasonStat> = {}): SkaterSeasonStat {
  return {
    player: playerFor(1),
    games_played: 82,
    goals: 20,
    assists: 30,
    points: 50,
    plus_minus: 5,
    pim: 24,
    hits: 60,
    power_play_goals: 8,
    shots_on_goal: 180,
    faceoff_winning_pctg: null,
    time_on_ice_seconds: 89540,
    shifts: 1840,
    blocked_shots: 30,
    giveaways: 40,
    takeaways: 35,
    faceoff_wins: 300,
    faceoff_losses: 250,
    shots_attempted: 260,
    missed_shots: 50,
    shots_blocked_against: 30,
    ...overrides,
  };
}

export function goalieSeasonStatFor(overrides: Partial<GoalieSeasonStat> = {}): GoalieSeasonStat {
  return {
    player: playerFor(1),
    games_played: 40,
    games_started: 38,
    wins: 20,
    losses: 15,
    ot_losses: 3,
    shutouts: 2,
    even_strength_shots_against: 900,
    even_strength_goals_against: 80,
    power_play_shots_against: 150,
    power_play_goals_against: 20,
    shorthanded_shots_against: 20,
    shorthanded_goals_against: 2,
    shots_against: 1070,
    saves: 968,
    goals_against: 102,
    save_pctg: 0.9047,
    goals_against_average: 2.55,
    pim: 2,
    time_on_ice_seconds: 144000,
    ...overrides,
  };
}

export function playerSeasonAdvancedStatFor(
  overrides: Partial<PlayerSeasonAdvancedStat> = {},
): PlayerSeasonAdvancedStat {
  return {
    player: playerFor(1),
    strength_state: "all",
    score_state: "all",
    games_played: 10,
    corsi_for: 120,
    corsi_against: 80,
    fenwick_for: 90,
    fenwick_against: 60,
    xg_for: 8.5,
    xg_against: 4.2,
    zone_entries: 0,
    zone_exits: 0,
    toi_seconds: 10800,
    ...overrides,
  };
}

export function teamSeasonAdvancedStatFor(
  overrides: Partial<TeamSeasonAdvancedStat> = {},
): TeamSeasonAdvancedStat {
  return {
    strength_state: "all",
    score_state: "all",
    games_played: 10,
    corsi_for: 580,
    corsi_against: 420,
    fenwick_for: 450,
    fenwick_against: 330,
    xg_for: 28.5,
    xg_against: 21.0,
    faceoff_wins: 300,
    faceoff_losses: 250,
    pdo: 100.9,
    toi_seconds: 36000,
    ...overrides,
  };
}

export const TEAM_STATS: Envelope<TeamStats, TeamStatsMeta> = {
  data: {
    skaters: [
      skaterSeasonStatFor({
        player: playerFor(1, { first_name: "Auston", last_name: "Matthews" }),
        goals: 40,
        assists: 26,
        points: 66,
      }),
      skaterSeasonStatFor({
        player: playerFor(2, { first_name: "William", last_name: "Nylander" }),
        goals: 30,
        assists: 49,
        points: 79,
      }),
    ],
    goalies: [
      goalieSeasonStatFor({
        player: playerFor(3, { first_name: "Anthony", last_name: "Stolarz" }),
      }),
    ],
    advanced: {
      players: [
        playerSeasonAdvancedStatFor({
          player: playerFor(1, { first_name: "Auston", last_name: "Matthews" }),
        }),
      ],
      team: [teamSeasonAdvancedStatFor()],
    },
  },
  meta: { season: "2025-26", game_type: "regular_season", skater_count: 2, goalie_count: 1 },
};

export function seasonFor(id: number, label: string): Season {
  return {
    id,
    label,
    starts_on: `20${label.slice(0, 2)}-10-01`,
    ends_on: `20${label.slice(-2)}-06-01`,
  };
}

export function playerSkaterSeasonFor(
  overrides: Partial<PlayerSkaterSeason> = {},
): PlayerSkaterSeason {
  return {
    season: seasonFor(1, "24-25"),
    team: teamFor(1, "TOR"),
    games_played: 82,
    goals: 20,
    assists: 30,
    points: 50,
    plus_minus: 5,
    pim: 24,
    hits: 60,
    power_play_goals: 8,
    shots_on_goal: 180,
    faceoff_winning_pctg: null,
    time_on_ice_seconds: 89540,
    shifts: 1840,
    blocked_shots: 30,
    giveaways: 40,
    takeaways: 35,
    faceoff_wins: 300,
    faceoff_losses: 250,
    shots_attempted: 260,
    missed_shots: 50,
    shots_blocked_against: 30,
    ...overrides,
  };
}

export function playerGoalieSeasonFor(
  overrides: Partial<PlayerGoalieSeason> = {},
): PlayerGoalieSeason {
  return {
    season: seasonFor(1, "24-25"),
    team: teamFor(1, "TOR"),
    games_played: 40,
    games_started: 38,
    wins: 20,
    losses: 15,
    ot_losses: 3,
    shutouts: 2,
    even_strength_shots_against: 900,
    even_strength_goals_against: 80,
    power_play_shots_against: 150,
    power_play_goals_against: 20,
    shorthanded_shots_against: 20,
    shorthanded_goals_against: 2,
    shots_against: 1070,
    saves: 968,
    goals_against: 102,
    save_pctg: 0.9047,
    goals_against_average: 2.55,
    pim: 2,
    time_on_ice_seconds: 144000,
    ...overrides,
  };
}

export function playerAdvancedSeasonFor(
  overrides: Partial<PlayerAdvancedSeason> = {},
): PlayerAdvancedSeason {
  return {
    season: seasonFor(1, "24-25"),
    team: teamFor(1, "TOR"),
    strength_state: "all",
    score_state: "all",
    games_played: 10,
    corsi_for: 120,
    corsi_against: 80,
    fenwick_for: 90,
    fenwick_against: 60,
    xg_for: 8.5,
    xg_against: 4.2,
    zone_entries: 0,
    zone_exits: 0,
    toi_seconds: 10800,
    ...overrides,
  };
}

export const PLAYER_DETAIL: Envelope<PlayerDetail, PlayerDetailMeta> = {
  data: {
    player: playerFor(1, { first_name: "Auston", last_name: "Matthews" }),
    current_team: teamFor(1, "TOR"),
    skater_seasons: [
      playerSkaterSeasonFor({ season: seasonFor(1, "24-25"), team: teamFor(1, "TOR"), goals: 40 }),
      playerSkaterSeasonFor({ season: seasonFor(2, "25-26"), team: teamFor(1, "TOR"), goals: 45 }),
    ],
    goalie_seasons: [],
    advanced_seasons: [
      playerAdvancedSeasonFor({ season: seasonFor(2, "25-26"), team: teamFor(1, "TOR") }),
    ],
  },
  meta: { game_type: "regular_season" },
};

export const DANGER_ZONES: DangerZoneGeometry = {
  goal_line_x: 89,
  high_danger_polygon: [
    [54, 22],
    [69, 22],
    [89, 4],
    [89, -4],
    [69, -22],
    [54, -22],
  ],
  high_danger_crease_radius_ft: 8,
  mid_range_max_distance_ft: 60,
};
