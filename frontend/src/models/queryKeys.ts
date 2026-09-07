// Kept apart from the request functions: `vi.mock` empties exported arrays, so a key
// beside a mocked fetcher becomes `[]` and collides with every other emptied key.
export const CURRENT_USER_KEY = ["currentUser"] as const;

export const LEAGUES_KEY = ["leagues"] as const;

export const leagueKey = (slug: string) => ["league", slug] as const;

export const standingsKey = (slug: string) => ["standings", slug] as const;

export const leagueGamesKey = (slug: string) => ["league-games", slug] as const;

export const teamKey = (teamId: number) => ["team", teamId] as const;

export const teamGamesKey = (teamId: number, season?: string, gameType?: string) =>
  ["team-games", teamId, season ?? "current", gameType ?? "all"] as const;

// Two-element form (no season) stays a prefix of the seasoned form, so invalidating
// `teamRosterKey(teamId)` still clears every season's roster for the team.
export const teamRosterKey = (teamId: number, season?: string) =>
  season === undefined
    ? (["team-roster", teamId] as const)
    : (["team-roster", teamId, season] as const);

export const teamStatsKey = (teamId: number, gameType?: string) =>
  ["team-stats", teamId, gameType ?? "regular_season"] as const;

export const teamAffiliationsKey = (teamId: number) => ["team-affiliations", teamId] as const;

export const teamLineupKey = (teamId: number, gameId: number) =>
  ["team-lineup", teamId, gameId] as const;

export const teamPreviousLineupKey = (teamId: number, gameId: number) =>
  ["team-lineup-previous", teamId, gameId] as const;

// Split so a status change can invalidate every season/page for a team at once,
// without needing to know which page or season the panel is currently showing.
export const rosterTransactionsTeamKey = (teamId: number) =>
  ["roster-transactions", teamId] as const;

export const rosterTransactionsKey = (teamId: number, season?: string, page?: number) =>
  [...rosterTransactionsTeamKey(teamId), season ?? "all", page ?? 1] as const;

export const SYNC_RUNS_KEY = ["sync-runs"] as const;

export const syncRunKey = (id: number) => ["sync-run", id] as const;

export const ROADMAP_KEY = ["roadmap"] as const;

export const XG_MODEL_KEY = ["xg-model"] as const;

export const SYNC_KINDS_KEY = ["sync-kinds"] as const;

export const DANGER_ZONES_KEY = ["danger-zones"] as const;

export const seasonsKey = (leagueSlug: string) => ["seasons", leagueSlug] as const;

export const coverageKey = (leagueId: number) => ["coverage", leagueId] as const;

export const coverageGapsKey = (seasonId: number, kind: string) =>
  ["coverage-gaps", seasonId, kind] as const;

export const tableSchemaKey = (resource: string, league: string) =>
  ["table-schema", resource, league] as const;

export const tableRowsKey = (resource: string, query: string) =>
  ["table-rows", resource, query] as const;

export const gameDetailKey = (gameId: number) => ["game-detail", gameId] as const;

export const gameShotsKey = (gameId: number) => ["game-shots", gameId] as const;

export const playerDetailKey = (playerId: number, gameType?: string) =>
  ["player-detail", playerId, gameType ?? "regular_season"] as const;
