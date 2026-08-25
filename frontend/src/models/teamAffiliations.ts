import { request } from "@/lib/apiClient";
import type { Team } from "@/models/teams";

export interface TeamAffiliation {
  id: number;
  team: Team;
}

export function fetchTeamAffiliations(teamId: number): Promise<TeamAffiliation[]> {
  return request<TeamAffiliation[]>(`/teams/${teamId}/affiliations`);
}
