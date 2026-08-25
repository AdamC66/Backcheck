import { requestWithMeta, type Envelope } from "@/lib/apiClient";
import type { RosterPlayer } from "@/models/roster";

export type GameType = "preseason" | "regular_season" | "playoffs";

export interface SkaterSeasonStat {
  player: RosterPlayer;
  games_played: number;
  goals: number;
  assists: number;
  points: number;
  plus_minus: number;
  pim: number;
  hits: number;
  power_play_goals: number;
  shots_on_goal: number;
  faceoff_winning_pctg: number | null;
  time_on_ice_seconds: number;
  shifts: number;
  blocked_shots: number;
  giveaways: number;
  takeaways: number;
}

export interface GoalieSeasonStat {
  player: RosterPlayer;
  games_played: number;
  games_started: number;
  wins: number;
  losses: number;
  ot_losses: number;
  shutouts: number;
  even_strength_shots_against: number;
  even_strength_goals_against: number;
  power_play_shots_against: number;
  power_play_goals_against: number;
  shorthanded_shots_against: number;
  shorthanded_goals_against: number;
  shots_against: number;
  saves: number;
  goals_against: number;
  save_pctg: number | null;
  goals_against_average: number | null;
  pim: number;
  time_on_ice_seconds: number;
}

export interface TeamStats {
  skaters: SkaterSeasonStat[];
  goalies: GoalieSeasonStat[];
}

export interface TeamStatsMeta {
  season: string;
  game_type: GameType;
  skater_count: number;
  goalie_count: number;
}

export function fetchTeamStats(
  teamId: number,
  gameType: GameType,
): Promise<Envelope<TeamStats, TeamStatsMeta>> {
  return requestWithMeta<TeamStats, TeamStatsMeta>(`/teams/${teamId}/stats?game_type=${gameType}`);
}
