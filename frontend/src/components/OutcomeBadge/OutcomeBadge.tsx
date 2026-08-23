import type { GameOutcome } from "@/lib/teamSchedule";

export interface OutcomeBadgeProps {
  outcome: GameOutcome;
}

const LABEL: Record<GameOutcome, string> = {
  win: "W",
  loss: "L",
  ot_loss: "OTL",
};

const TONE: Record<GameOutcome, string> = {
  win: "bg-emerald-100 text-emerald-800",
  loss: "bg-red-100 text-red-800",
  ot_loss: "bg-amber-100 text-amber-800",
};

export function OutcomeBadge({ outcome }: OutcomeBadgeProps) {
  return (
    <span className={`px-1.5 py-0.5 text-xs font-semibold ${TONE[outcome]}`}>{LABEL[outcome]}</span>
  );
}
