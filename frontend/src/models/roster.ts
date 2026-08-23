import { requestWithMeta, type Envelope } from "@/lib/apiClient";
import type { Team } from "@/models/teams";

export type Position = "center" | "left_wing" | "right_wing" | "forward" | "defense" | "goalie";

export interface PlayerDraft {
  year: number;
  round: number | null;
  overall: number | null;
  team_name: string | null;
}

export interface RosterPlayer {
  id: number;
  first_name: string;
  last_name: string;
  position: Position;
  shoots_catches: string | null;
  height_in_inches: number | null;
  weight_in_pounds: number | null;
  birth_date: string | null;
  birth_city: string | null;
  birth_country: string | null;
  headshot_url: string | null;
  draft: PlayerDraft | null;
}

export interface RosterAssignment {
  team: Team;
  contract_level: string;
  contract_level_inferred: boolean;
}

export interface RosterEntry {
  player: RosterPlayer;
  jersey_number: number | null;
  contract_level: string;
  assignment: RosterAssignment | null;
}

export interface RosterMeta {
  season: string;
  count: number;
}

export function fetchTeamRoster(teamId: number): Promise<Envelope<RosterEntry[], RosterMeta>> {
  return requestWithMeta<RosterEntry[], RosterMeta>(`/teams/${teamId}/roster`);
}
