import { requestWithMeta, type Envelope } from "@/lib/apiClient";
import type { ScoreState, StrengthState } from "@/models/gameDetail";
import type { RosterPlayer } from "@/models/roster";
import type { Season } from "@/models/seasons";
import type { GameType } from "@/models/teamStats";
import type { Team } from "@/models/teams";

export interface PlayerSkaterSeason {
  season: Season;
  team: Team;
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

export interface PlayerGoalieSeason {
  season: Season;
  team: Team;
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

export interface PlayerAdvancedSeason {
  season: Season;
  team: Team;
  strength_state: StrengthState;
  score_state: ScoreState;
  games_played: number;
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

export interface PlayerDetail {
  player: RosterPlayer;
  /** The org on the player's most recent roster spot — null if never rostered. */
  current_team: Team | null;
  skater_seasons: PlayerSkaterSeason[];
  goalie_seasons: PlayerGoalieSeason[];
  advanced_seasons: PlayerAdvancedSeason[];
}

export interface PlayerDetailMeta {
  game_type: GameType;
}

export function fetchPlayerDetail(
  playerId: number,
  gameType: GameType,
): Promise<Envelope<PlayerDetail, PlayerDetailMeta>> {
  return requestWithMeta<PlayerDetail, PlayerDetailMeta>(
    `/players/${playerId}?game_type=${gameType}`,
  );
}
