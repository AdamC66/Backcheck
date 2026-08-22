import { requestWithMeta, type Envelope } from "@/lib/apiClient";
import type { Team } from "@/models/teams";

export interface StandingRecord {
  wins: number;
  losses: number;
  ot_losses: number;
}

export interface Standing {
  team: Team;
  as_of_date: string;
  games_played: number;
  wins: number;
  losses: number;
  ot_losses: number;
  points: number;
  point_pctg: number | null;
  goals_for: number;
  goals_against: number;
  goal_differential: number;
  regulation_wins: number | null;
  regulation_plus_ot_wins: number | null;
  streak_code: string | null;
  streak_count: number | null;
  conference_name: string | null;
  conference_sequence: number | null;
  division_name: string | null;
  division_sequence: number | null;
  league_sequence: number | null;
  wildcard_sequence: number | null;
  home_record: StandingRecord;
  road_record: StandingRecord;
  l10_record: StandingRecord;
}

export interface StandingsMeta {
  season: string;
  as_of_date: string | null;
}

export function fetchStandings(leagueSlug: string): Promise<Envelope<Standing[], StandingsMeta>> {
  return requestWithMeta<Standing[], StandingsMeta>(
    `/leagues/${encodeURIComponent(leagueSlug)}/standings`,
  );
}
