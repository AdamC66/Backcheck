import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/Button/Button";
import { SYNC_KIND_LABELS, type SyncKind } from "@/models/adminSync";
import type { League } from "@/models/leagues";
import { useCreateSyncRun } from "@/models/useCreateSyncRun";
import { useSeasons } from "@/models/useSeasons";
import { useSyncKinds } from "@/models/useSyncKinds";

// Only the kinds a single team can be scoped to — standings/daily-scores are
// league-wide with no team axis, so they don't belong on a team's own page.
const TEAM_SCOPED_KINDS: SyncKind[] = [
  "team_roster",
  "affiliate_roster",
  "team_schedule",
  "game_stats",
];

export interface ResyncTeamMenuProps {
  teamId: number;
  league: League | undefined;
}

export function ResyncTeamMenu({ teamId, league }: ResyncTeamMenuProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const kinds = useSyncKinds(isOpen);
  // Seasons endpoint already orders newest-first, so the first row is "current."
  const seasons = useSeasons(isOpen ? (league?.slug ?? null) : null);
  const createSyncRun = useCreateSyncRun();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;

      if (target instanceof Node && containerRef.current?.contains(target) !== true) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (user?.is_super_admin !== true || league === undefined) {
    return null;
  }

  const available = (kinds.data ?? []).filter((entry) => TEAM_SCOPED_KINDS.includes(entry.kind));

  function resync(kind: SyncKind, needsSeason: boolean) {
    setIsOpen(false);
    createSyncRun.mutate(
      {
        sync_kinds: [kind],
        league_id: league?.id,
        team_id: teamId,
        season_id: needsSeason ? seasons.data?.[0]?.id : undefined,
      },
      { onSuccess: (run) => navigate(`/admin/sync/${run.id}`) },
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        Resync
      </Button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-2 w-48 overflow-hidden border border-slate-200 bg-white shadow-lg"
        >
          {available.map((entry) => (
            <button
              key={entry.kind}
              type="button"
              role="menuitem"
              disabled={createSyncRun.isPending}
              onClick={() => resync(entry.kind, entry.scope.includes("season"))}
              className="block w-full cursor-pointer px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {SYNC_KIND_LABELS[entry.kind]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
