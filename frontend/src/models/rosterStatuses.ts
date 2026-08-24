import { request } from "@/lib/apiClient";
import type { RosterStatusValue } from "@/models/roster";

export interface SetRosterStatusResult {
  player_id: number;
  status: RosterStatusValue;
  started_on: string | null;
}

export function setRosterStatus(
  teamId: number,
  playerId: number,
  status: RosterStatusValue,
  effectiveOn: string,
): Promise<SetRosterStatusResult> {
  return request<SetRosterStatusResult>(`/teams/${teamId}/roster_statuses/${playerId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, effective_on: effectiveOn }),
  });
}
