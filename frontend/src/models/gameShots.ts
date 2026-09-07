import { requestWithMeta, type Envelope } from "@/lib/apiClient";

export type ShotTeamSide = "home" | "away";

export interface GameShot {
  x: number;
  y: number;
  team_side: ShotTeamSide;
  is_goal: boolean;
  shot_type: string | null;
  distance: number;
  xg: number;
  shooter_id: number | null;
  shooter_name: string | null;
  period: number;
  period_time_seconds: number;
}

export interface GameShotsMeta {
  unlocated_count: number;
}

export function fetchGameShots(gameId: number): Promise<Envelope<GameShot[], GameShotsMeta>> {
  return requestWithMeta<GameShot[], GameShotsMeta>(`/games/${gameId}/shots`);
}
