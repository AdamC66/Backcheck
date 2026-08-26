import { useState } from "react";
import { Link, Outlet } from "react-router";
import { ChevronIcon } from "@/components/ChevronIcon/ChevronIcon";
import { PageShell } from "@/components/PageShell/PageShell";
import { SideNav } from "@/components/SideNav/SideNav";
import { Text } from "@/components/Text/Text";
import { UserMenu } from "@/containers/UserMenu";

const NAV_ITEMS = [
  { label: "Sync Runs", to: "", end: true },
  { label: "Roadmap", to: "roadmap" },
];

const DESKTOP_BREAKPOINT = 1024;

export function AdminPage() {
  const [navOpen, setNavOpen] = useState(() => window.innerWidth >= DESKTOP_BREAKPOINT);

  return (
    <PageShell actions={<UserMenu />} width="full">
      <div className="flex min-w-0 flex-1">
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
                to="/"
                className="mb-5 flex items-center gap-1.5 px-2 text-xs font-bold tracking-wide text-team-contrast/50 uppercase hover:text-team-contrast/80"
              >
                <ChevronIcon direction="left" />
                Dashboard
              </Link>

              <div className="mb-5 px-2">
                <Text variant="label" className="text-lg tracking-wide text-team-contrast">
                  Admin
                </Text>
              </div>

              <div className="mb-5 flex flex-col">
                <div className="h-1 bg-team-trim" />
                <div className="h-2.5 bg-team-secondary" />
                <div className="h-1 bg-team-trim" />
              </div>

              <SideNav items={NAV_ITEMS} label="Admin sections" />
            </>
          ) : null}
        </aside>

        <div className="min-w-0 flex-1 bg-slate-50 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <Outlet />
        </div>
      </div>
    </PageShell>
  );
}
