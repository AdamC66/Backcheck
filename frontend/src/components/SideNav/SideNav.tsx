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

// Styled for the navy team-color sidebar it lives in, not a light page — this
// component has no other context to stay generic for.
const BASE_LINK = "border-l-[3px] px-3.5 py-2.5 text-sm font-bold transition-colors";
const ACTIVE_LINK = "border-team-trim bg-white/10 text-team-contrast";
const INACTIVE_LINK =
  "border-transparent text-team-contrast/60 hover:bg-white/5 hover:text-team-contrast/90";

export function SideNav({ items, label }: SideNavProps) {
  return (
    <nav aria-label={label} className="flex flex-col gap-0.5">
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
