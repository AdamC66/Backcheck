import { NavLink } from "react-router";

export interface SideNavItem {
  label: string;
  to: string;
  /** Passed through to NavLink — needed for an index route, or its parent matches too. */
  end?: boolean;
}

export interface SideNavProps {
  items: SideNavItem[];
  label: string;
}

const BASE_LINK = "rounded-md px-3 py-2 text-sm font-medium transition-colors";
const ACTIVE_LINK = "bg-team-primary text-team-contrast";
const INACTIVE_LINK = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

export function SideNav({ items, label }: SideNavProps) {
  return (
    <nav aria-label={label} className="flex w-40 shrink-0 flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `${BASE_LINK} ${isActive ? ACTIVE_LINK : INACTIVE_LINK}`}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
