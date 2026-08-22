import type { User } from "@/models/auth";
import type { League, LeagueWithTeams } from "@/models/leagues";
import type { Team } from "@/models/teams";

// Shared fixtures so test files assert against one definition of "a user" rather
// than each inventing its own shape.
export const SUPER_ADMIN: User = {
  id: 1,
  email: "admin@example.com",
  is_super_admin: true,
};

export const TEAM_USER: User = {
  id: 2,
  email: "gm@example.com",
  is_super_admin: false,
};

export const LEAGUES: League[] = [
  {
    id: 1,
    name: "National Hockey League",
    slug: "nhl",
    abbreviation: "NHL",
    tier: 1,
    logo_url: "http://localhost:3000/rails/active_storage/blobs/proxy/nhl/NHL.svg",
  },
  {
    id: 2,
    name: "American Hockey League",
    slug: "ahl",
    abbreviation: "AHL",
    tier: 2,
    logo_url: "http://localhost:3000/rails/active_storage/blobs/proxy/ahl/AHL.svg",
  },
  {
    id: 3,
    name: "ECHL",
    slug: "echl",
    abbreviation: "ECHL",
    tier: 3,
    logo_url: "http://localhost:3000/rails/active_storage/blobs/proxy/echl/ECHL.svg",
  },
];

export const TEAMS: Team[] = [
  {
    id: 1,
    name: "Anaheim Ducks",
    abbreviation: "ANA",
    logo_url: "http://localhost:3000/rails/active_storage/blobs/proxy/ana/anaheim.png",
    primary_color: "#F47A38",
    secondary_color: "#B9975B",
    tertiary_color: "#C1C6C8",
  },
  {
    id: 2,
    name: "Boston Bruins",
    abbreviation: "BOS",
    logo_url: null,
    primary_color: null,
    secondary_color: null,
    tertiary_color: null,
  },
];

export const LEAGUE_WITH_TEAMS: LeagueWithTeams = { ...LEAGUES[0], teams: TEAMS };
