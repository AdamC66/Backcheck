import { useState } from "react";
import { Link, Navigate, Outlet, useParams } from "react-router";
import { PageShell } from "@/components/PageShell/PageShell";
import { Row } from "@/components/Row/Row";
import { SideNav } from "@/components/SideNav/SideNav";
import { TeamTheme } from "@/components/TeamTheme/TeamTheme";
import { Text } from "@/components/Text/Text";
import { ResyncTeamMenu } from "@/containers/TeamPage/ResyncTeamMenu";
import { UserMenu } from "@/containers/UserMenu";
import { useTeam } from "@/models/useTeam";

const NAV_ITEMS = [
  { label: "Overview", to: "", end: true },
  { label: "Schedule", to: "schedule" },
  { label: "Roster", to: "roster" },
  { label: "Stats", to: "stats" },
];

const DESKTOP_BREAKPOINT = 1024;

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="square"
    >
      <path d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

export function TeamPage() {
  const { id } = useParams();
  const teamId = Number(id);
  const valid = Number.isInteger(teamId) && teamId > 0;
  const [navOpen, setNavOpen] = useState(() => window.innerWidth >= DESKTOP_BREAKPOINT);

  const team = useTeam(valid ? teamId : null);
  const league = team.data?.league;

  if (!valid) {
    return <Navigate to="/" replace />;
  }

  if (team.isError) {
    return (
      <PageShell actions={<UserMenu />}>
        <Text tone="danger">Could not load this team.</Text>
      </PageShell>
    );
  }

  return (
    <PageShell
      actions={
        <Row gap="sm">
          <ResyncTeamMenu teamId={teamId} league={league} />
          <UserMenu />
        </Row>
      }
      width="full"
    >
      <TeamTheme team={team.data} className="flex min-w-0 flex-1">
        {navOpen ? (
          <div
            className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
            onClick={() => setNavOpen(false)}
          />
        ) : null}

        <aside
          className={`flex shrink-0 flex-col bg-team-primary py-6 transition-all duration-200 ${
            navOpen
              ? "fixed inset-y-0 left-0 z-40 w-72 px-4 shadow-2xl lg:static lg:z-auto lg:w-64 lg:shadow-none"
              : "w-14 items-center px-2"
          }`}
        >
          <button
            type="button"
            onClick={() => setNavOpen((open) => !open)}
            aria-label={navOpen ? "Collapse navigation" : "Expand navigation"}
            className={`flex size-7 shrink-0 items-center justify-center text-team-contrast/60 hover:text-team-contrast ${
              navOpen ? "mb-5 ml-auto" : ""
            }`}
          >
            <ChevronIcon direction={navOpen ? "left" : "right"} />
          </button>

          {navOpen ? (
            <>
              <Link
                to={league === undefined ? "/" : `/leagues/${league.slug}`}
                className="mb-5 flex items-center gap-1.5 px-2 text-xs font-bold tracking-wide text-team-contrast/50 uppercase hover:text-team-contrast/80"
              >
                <ChevronIcon direction="left" />
                {league?.name ?? "All leagues"}
              </Link>

              <div className="mb-5 flex items-center gap-3 px-2">
                <span className="flex size-11 shrink-0 items-center justify-center bg-white p-1.5">
                  {team.data?.logo_url === null || team.data?.logo_url === undefined ? (
                    <Text variant="label" className="font-display text-team-primary">
                      {team.data?.abbreviation}
                    </Text>
                  ) : (
                    <img
                      src={team.data.logo_url}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-lg font-semibold tracking-wide text-team-contrast">
                    {team.data?.name ?? "Team"}
                  </span>
                  {league === undefined ? null : (
                    <span className="block text-[11px] font-bold tracking-widest text-team-contrast/45">
                      {league.abbreviation}
                    </span>
                  )}
                </span>
              </div>

              <div className="mb-5 flex flex-col">
                <div className="h-1 bg-team-trim" />
                <div className="h-2.5 bg-team-secondary" />
                <div className="h-1 bg-team-trim" />
              </div>

              <SideNav items={NAV_ITEMS} label="Team sections" />
            </>
          ) : null}
        </aside>

        <div className="min-w-0 flex-1 bg-slate-50 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <Outlet />
        </div>
      </TeamTheme>
    </PageShell>
  );
}
