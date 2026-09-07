import { requestWithMeta, type Envelope } from "@/lib/apiClient";
import type { Game } from "@/models/games";
import type { RosterPlayer } from "@/models/roster";

export interface SkaterGameStat {
  player: RosterPlayer;
  team_id: number;
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
  faceoff_wins: number;
  faceoff_losses: number;
  shots_attempted: number;
  missed_shots: number;
  shots_blocked_against: number;
}

export interface GoalieGameStat {
  player: RosterPlayer;
  team_id: number;
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
  pim: number;
  time_on_ice_seconds: number;
  starter: boolean;
  decision: "W" | "L" | "O" | null;
}

export type StrengthState = "all" | "5v5" | "pp" | "sh";
export type ScoreState = "all" | "close";

export interface PlayerGameAdvancedStat {
  player: RosterPlayer;
  team_id: number;
  strength_state: StrengthState;
  score_state: ScoreState;
  corsi_for: number;
  corsi_against: number;
  fenwick_for: number;
  fenwick_against: number;
  xg_for: number;
  xg_against: number;
  zone_entries: number;
  zone_exits: number;
  toi_seconds: number;
}

export interface TeamGameAdvancedStat {
  team_id: number;
  strength_state: StrengthState;
  score_state: ScoreState;
  corsi_for: number;
  corsi_against: number;
  fenwick_for: number;
  fenwick_against: number;
  xg_for: number;
  xg_against: number;
  faceoff_wins: number;
  faceoff_losses: number;
  pdo: number;
  toi_seconds: number;
}

export type Zone = "offensive" | "neutral" | "defensive";

export interface ZoneSegment {
  start_seconds: number;
  end_seconds: number;
  zone: Zone;
}

export interface ZoneTimePeriod {
  period: number;
  length_seconds: number;
  segments: ZoneSegment[];
}

export interface ZoneTimeSkater {
  player: RosterPlayer;
  team_id: number;
  starts: { offensive: number; neutral: number; defensive: number; on_the_fly: number };
  seconds: { offensive: number; neutral: number; defensive: number };
}

// segments and totals are in the home team's frame: "offensive" = the home team attacking.
// The away team's split is the mirror (its offensive === home defensive).
export interface GameZoneTime {
  periods: ZoneTimePeriod[];
  totals: { offensive_seconds: number; neutral_seconds: number; defensive_seconds: number };
  skaters: ZoneTimeSkater[];
}

export type EventStrengthState = "even_strength" | "power_play" | "short_handed";

export interface GoalEvent {
  id: number;
  type: "goal";
  period: number;
  period_time_seconds: number;
  team_id: number;
  strength_state: EventStrengthState | null;
  scorer: RosterPlayer;
  assists: RosterPlayer[];
}

export type PenaltyType =
  "minor" | "major" | "bench-minor" | "misconduct" | "game-misconduct" | "match" | "penalty-shot";

export interface PenaltyEvent {
  id: number;
  type: "penalty";
  period: number;
  period_time_seconds: number;
  team_id: number;
  strength_state: EventStrengthState | null;
  committed_by: RosterPlayer | null;
  drawn_by: RosterPlayer | null;
  infraction: string | null;
  penalty_type: PenaltyType | null;
  penalty_minutes: number | null;
}

export interface PeriodSummaryLine {
  period: number;
  home: { goals: number; shots_on_goal: number };
  away: { goals: number; shots_on_goal: number };
}

export interface GamePeriodSummary {
  periods: PeriodSummaryLine[];
  totals: {
    home: { goals: number; shots_on_goal: number };
    away: { goals: number; shots_on_goal: number };
  };
}

export interface GameDetail {
  game: Game;
  skaters: SkaterGameStat[];
  goalies: GoalieGameStat[];
  goals: GoalEvent[];
  penalties: PenaltyEvent[];
  advanced: {
    players: PlayerGameAdvancedStat[];
    teams: TeamGameAdvancedStat[];
  };
  zone_time: GameZoneTime;
  period_summary: GamePeriodSummary;
}

export interface GameDetailMeta {
  stats_syncing?: boolean;
}

export function fetchGameDetail(gameId: number): Promise<Envelope<GameDetail, GameDetailMeta>> {
  return requestWithMeta<GameDetail, GameDetailMeta>(`/games/${gameId}`);
}
