import { request } from "@/lib/apiClient";
import type { Team } from "@/models/teams";

export interface League {
  id: number;
  name: string;
  slug: string;
  abbreviation: string;
  tier: number;
  logo_url: string | null;
}

export interface LeagueWithTeams extends League {
  teams: Team[];
}

export function fetchLeagues(): Promise<League[]> {
  return request<League[]>("/leagues");
}

export function fetchLeague(slug: string): Promise<LeagueWithTeams> {
  return request<LeagueWithTeams>(`/leagues/${encodeURIComponent(slug)}`);
}
