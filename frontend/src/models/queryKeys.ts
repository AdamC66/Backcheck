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
