import type { User } from "@/models/auth";

// Only the common case: a direct gm Membership on the team, or super admin. Doesn't
// walk the league_admin hierarchy the backend's authorize_team! also grants — this is
// a display gate, not enforcement, so under-showing a control is the safe direction.
export function isTeamGm(user: User | null, teamId: number): boolean {
  if (user === null) return false;
  if (user.is_super_admin) return true;

  return user.memberships.some(
    (membership) =>
      membership.role === "gm" &&
      membership.scope_type === "team" &&
      membership.scopeable_id === teamId,
  );
}
