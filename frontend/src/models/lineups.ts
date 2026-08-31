import { request } from "@/lib/apiClient";
import type { RosterPlayer } from "@/models/roster";

export interface Lineup {
  team_id: number;
  game_id: number;
  /** True once the game's scheduled start has passed: read-only, publicly visible. */
  historical: boolean;
  forward_lines: RosterPlayer[][];
  defense_pairs: RosterPlayer[][];
  power_play_units: RosterPlayer[][];
  penalty_kill_units: RosterPlayer[][];
  starting_goalie: RosterPlayer | null;
  backup_goalie: RosterPlayer | null;
  scratches: RosterPlayer[];
}

export interface LineupInput {
  forward_lines: number[][];
  defense_pairs: number[][];
  power_play_units: number[][];
  penalty_kill_units: number[][];
  starting_goalie_id: number | null;
  backup_goalie_id: number | null;
  scratches: number[];
}

export function fetchLineup(teamId: number, gameId: number): Promise<Lineup> {
  return request<Lineup>(`/teams/${teamId}/lineups/${gameId}`);
}

// The team's most recent lineup from a game before this one — a starting point when a
// new game's lineup is a small edit of the last one. 404s when there is no earlier one.
export function fetchPreviousLineup(teamId: number, gameId: number): Promise<Lineup> {
  return request<Lineup>(`/teams/${teamId}/lineups/${gameId}/previous`);
}

export function setLineup(teamId: number, gameId: number, input: LineupInput): Promise<Lineup> {
  return request<Lineup>(`/teams/${teamId}/lineups/${gameId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
