import type { User } from "@/models/auth";

export function isTeamGm(user: User | null, teamId: number): boolean {
  return hasTeamRole(user, teamId, "gm");
}

export function isTeamCoach(user: User | null, teamId: number): boolean {
  return hasTeamRole(user, teamId, "coaching_staff");
}

// Only the common case: a direct team Membership with this role, or super admin. Doesn't
// walk the league_admin hierarchy the backend's authorize_team! also grants — this is
// a display gate, not enforcement, so under-showing a control is the safe direction.
function hasTeamRole(user: User | null, teamId: number, role: string): boolean {
  if (user === null) return false;
  if (user.is_super_admin) return true;

  return user.memberships.some(
    (membership) =>
      membership.role === role &&
      membership.scope_type === "team" &&
      membership.scopeable_id === teamId,
  );
}
