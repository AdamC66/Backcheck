import { request } from "@/lib/apiClient";
import type { Team } from "@/models/teams";

export interface League {
  id: number;
  name: string;
  slug: string;
  abbreviation: string;
  /** Rank in the affiliation hierarchy: NHL 1, AHL 2, ECHL 3. */
  tier: number;
  /** Absolute URL served by the backend's storage layer; null when no logo is attached. */
  logo_url: string | null;
}

// The detail endpoint embeds the roster of teams so a deep link renders in one request.
export interface LeagueWithTeams extends League {
  teams: Team[];
}

export function fetchLeagues(): Promise<League[]> {
  return request<League[]>("/leagues");
}

export function fetchLeague(slug: string): Promise<LeagueWithTeams> {
  return request<LeagueWithTeams>(`/leagues/${encodeURIComponent(slug)}`);
}
