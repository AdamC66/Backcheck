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

export const teamRosterKey = (teamId: number) => ["team-roster", teamId] as const;

export const teamStatsKey = (teamId: number, gameType?: string) =>
  ["team-stats", teamId, gameType ?? "regular_season"] as const;

export const teamAffiliationsKey = (teamId: number) => ["team-affiliations", teamId] as const;

// Split so a status change can invalidate every season/page for a team at once,
// without needing to know which page or season the panel is currently showing.
export const rosterTransactionsTeamKey = (teamId: number) =>
  ["roster-transactions", teamId] as const;

export const rosterTransactionsKey = (teamId: number, season?: string, page?: number) =>
  [...rosterTransactionsTeamKey(teamId), season ?? "all", page ?? 1] as const;

export const SYNC_RUNS_KEY = ["sync-runs"] as const;
