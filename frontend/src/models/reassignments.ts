import { request } from "@/lib/apiClient";
import type { RosterPlayer } from "@/models/roster";
import type { Team } from "@/models/teams";

export interface ReassignmentResult {
  team: Team;
  player: RosterPlayer;
  jersey_number: number | null;
  contract_level: string;
}

export function sendPlayerDown(
  teamId: number,
  playerId: number,
  destinationTeamId: number,
): Promise<ReassignmentResult> {
  return request<ReassignmentResult>(`/teams/${teamId}/reassignments/${playerId}`, {
    method: "PATCH",
    body: JSON.stringify({ destination_team_id: destinationTeamId }),
  });
}

// Direction is inferred server-side from where the player's roster_spot currently sits
// — a call-up needs no destination, since there's only one place to bring them back to.
export function callPlayerUp(teamId: number, playerId: number): Promise<ReassignmentResult> {
  return request<ReassignmentResult>(`/teams/${teamId}/reassignments/${playerId}`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}
