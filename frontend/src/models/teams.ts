import { request } from "@/lib/apiClient";
import type { League } from "@/models/leagues";

export interface Team {
  id: number;
  name: string;
  abbreviation: string;
  nhl_team_id: number | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  tertiary_color: string | null;
  /** Only the team detail endpoint sends this; collections already know their league. */
  league?: League;
}

export function fetchTeam(teamId: number): Promise<Team> {
  return request<Team>(`/teams/${teamId}`);
}
