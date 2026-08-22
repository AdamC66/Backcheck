// Every React Query key in one module, deliberately apart from the request functions:
// `vi.mock` auto-mocking empties exported arrays, so a key living beside a mocked fetch
// function silently becomes `[]` in tests — and two such keys then collide in the cache.
export const CURRENT_USER_KEY = ["currentUser"] as const;

export const LEAGUES_KEY = ["leagues"] as const;

export const leagueKey = (slug: string) => ["league", slug] as const;

export const standingsKey = (slug: string) => ["standings", slug] as const;
