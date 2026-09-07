import { NavLink } from "react-router";

export interface TabNavItem {
  label: string;
  to: string;
  /** Passed to NavLink — an index tab needs it or its parent path matches too. */
  end?: boolean;
}

export interface TabNavProps {
  items: TabNavItem[];
  label: string;
}

const BASE =
  "border-b-2 px-1 pb-2 text-sm font-semibold tracking-wide uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";
const ACTIVE = "border-team-primary text-team-primary";
const INACTIVE = "border-transparent text-slate-500 hover:text-slate-800";

export function TabNav({ items, label }: TabNavProps) {
  return (
    <nav
      aria-label={label}
      className="flex gap-6 overflow-x-auto border-b border-slate-200 whitespace-nowrap"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `${BASE} ${isActive ? ACTIVE : INACTIVE}`}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
