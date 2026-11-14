import { requestWithMeta, type Envelope } from "@/lib/apiClient";
import type { GameType } from "@/models/games";

export type ShotStrengthState = "even_strength" | "power_play" | "short_handed" | null;

export interface TeamShotLocation {
  x: number;
  y: number;
  is_goal: boolean;
  strength_state: ShotStrengthState;
}

export interface TeamShotLocations {
  for: TeamShotLocation[];
  against: TeamShotLocation[];
}

export interface TeamShotLocationsMeta {
  season: string;
  game_type: GameType;
  unlocated_for: number;
  unlocated_against: number;
}

export function fetchTeamShotLocations(
  teamId: number,
  params: { season?: string; gameType?: GameType },
): Promise<Envelope<TeamShotLocations, TeamShotLocationsMeta>> {
  const query = new URLSearchParams();
  if (params.season) query.set("season", params.season);
  if (params.gameType) query.set("game_type", params.gameType);
  const suffix = query.toString() ? `?${query}` : "";

  return requestWithMeta<TeamShotLocations, TeamShotLocationsMeta>(
    `/teams/${teamId}/shot_locations${suffix}`,
  );
}
