export interface Team {
  id: number;
  name: string;
  abbreviation: string;
  /** Absolute URL served by the backend's storage layer; null when no logo is attached. */
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  tertiary_color: string | null;
}
