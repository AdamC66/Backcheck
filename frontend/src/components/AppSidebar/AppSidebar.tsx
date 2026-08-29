import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ChevronIcon } from "@/components/ChevronIcon/ChevronIcon";
import { SideNav, type SideNavItem } from "@/components/SideNav/SideNav";

const DESKTOP_BREAKPOINT = 1024;

export interface AppSidebarProps {
  backTo: string;
  backLabel: string;
  // Caller-specific title block (see SidebarBrand), rendered as-is with its own spacing.
  header: ReactNode;
  navItems: SideNavItem[];
  navLabel: string;
}

// The navy section sidebar shared by the admin console, team page, and league page.
// Reads the team CSS vars, which default to slate-800 on :root when there's no
// TeamTheme ancestor. Renders its own mobile scrim; the parent supplies the flex row.
export function AppSidebar({ backTo, backLabel, header, navItems, navLabel }: AppSidebarProps) {
  const [open, setOpen] = useState(() => window.innerWidth >= DESKTOP_BREAKPOINT);

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`flex shrink-0 flex-col bg-team-primary py-6 transition-all duration-200 ${
          open
            ? "fixed inset-y-0 left-0 z-40 w-72 px-4 shadow-2xl lg:static lg:z-auto lg:w-64 lg:shadow-none"
            : "w-14 items-center px-2"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? "Collapse navigation" : "Expand navigation"}
          className={`flex size-7 shrink-0 items-center justify-center text-team-contrast/60 hover:text-team-contrast ${
            open ? "mb-5 ml-auto" : ""
          }`}
        >
          <ChevronIcon direction={open ? "left" : "right"} />
        </button>

        {open ? (
          <>
            <Link
              to={backTo}
              className="mb-5 flex items-center gap-1.5 px-2 text-xs font-bold tracking-wide text-team-contrast/50 uppercase hover:text-team-contrast/80"
            >
              <ChevronIcon direction="left" />
              {backLabel}
            </Link>

            {header}

            <div className="mb-5 flex flex-col">
              <div className="h-1 bg-team-trim" />
              <div className="h-2.5 bg-team-secondary" />
              <div className="h-1 bg-team-trim" />
            </div>

            <SideNav items={navItems} label={navLabel} />
          </>
        ) : null}
      </aside>
    </>
  );
}
