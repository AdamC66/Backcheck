import { requestWithMeta, type Envelope } from "@/lib/apiClient";
import type { Team } from "@/models/teams";

export type GameType = "preseason" | "regular_season" | "playoffs";

export interface GameSide {
  team: Team;
  score: number | null;
}

export interface Game {
  id: number;
  nhl_game_id: number;
  game_type: GameType | null;
  game_date: string;
  starts_at: string;
  venue: string | null;
  neutral_site: boolean;
  state: string;
  last_period_type: string | null;
  home: GameSide;
  away: GameSide;
}

export interface GamesMeta {
  season?: string;
  from: string | null;
  to: string | null;
  count: number;
}

export interface TeamGamesParams {
  season?: string;
  gameType?: GameType;
}

export function fetchTeamGames(
  teamId: number,
  { season, gameType }: TeamGamesParams = {},
): Promise<Envelope<Game[], GamesMeta>> {
  const query = new URLSearchParams();
  if (season !== undefined) query.set("season", season);
  if (gameType !== undefined) query.set("game_type", gameType);

  const suffix = query.size === 0 ? "" : `?${query.toString()}`;

  return requestWithMeta<Game[], GamesMeta>(`/teams/${teamId}/games${suffix}`);
}
