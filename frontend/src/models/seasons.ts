import { request } from "@/lib/apiClient";

export interface Season {
  id: number;
  label: string;
  starts_on: string;
  ends_on: string;
}

export function fetchSeasons(leagueSlug: string): Promise<Season[]> {
  return request<Season[]>(`/leagues/${encodeURIComponent(leagueSlug)}/seasons`);
}
