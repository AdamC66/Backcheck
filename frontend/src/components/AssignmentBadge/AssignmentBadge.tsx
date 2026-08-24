import type { RosterAssignment } from "@/models/roster";

export interface AssignmentBadgeProps {
  assignment: RosterAssignment | null;
}

export function AssignmentBadge({ assignment }: AssignmentBadgeProps) {
  if (assignment === null) return null;

  const { team, contract_level_inferred } = assignment;
  const title = contract_level_inferred
    ? `Assigned to ${team.name} (inferred, not reported directly)`
    : `Assigned to ${team.name}`;

  return (
    <span
      title={title}
      className="inline-flex shrink-0 items-center gap-1 border border-team-primary/20 bg-team-primary/10 px-1.5 py-0.5 text-xs font-bold text-team-primary"
    >
      {team.abbreviation}
    </span>
  );
}
