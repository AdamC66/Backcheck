export interface Team {
  id: number;
  name: string;
  abbreviation: string;
  nhl_team_id: number | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  tertiary_color: string | null;
}
