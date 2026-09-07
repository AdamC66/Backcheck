import { useOutletContext } from "react-router";
import type { GameDetail } from "@/models/gameDetail";

export interface GameContext {
  detail: GameDetail;
  statsSyncing: boolean;
}

export function useGameContext(): GameContext {
  return useOutletContext<GameContext>();
}

export function bySide<T extends { team_id: number }>(rows: T[], teamId: number): T[] {
  return rows.filter((row) => row.team_id === teamId);
}
