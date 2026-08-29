import { Text } from "@/components/Text/Text";

export interface SidebarBrandProps {
  name: string;
  logoUrl: string | null | undefined;
  // Shown in the logo badge when there's no logo (a team/league abbreviation).
  fallback: string | undefined;
  subtitle?: string;
}

// The logo-badge + name block for AppSidebar's `header` slot, shared by the team and
// league sidebars.
export function SidebarBrand({ name, logoUrl, fallback, subtitle }: SidebarBrandProps) {
  return (
    <div className="mb-5 flex items-center gap-3 px-2">
      <span className="flex size-11 shrink-0 items-center justify-center bg-white p-1.5">
        {logoUrl === null || logoUrl === undefined ? (
          <Text variant="label" className="font-display text-team-primary">
            {fallback}
          </Text>
        ) : (
          <img src={logoUrl} alt="" className="max-h-full max-w-full object-contain" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-lg font-semibold tracking-wide text-team-contrast">
          {name}
        </span>
        {subtitle === undefined ? null : (
          <span className="block text-[11px] font-bold tracking-widest text-team-contrast/45">
            {subtitle}
          </span>
        )}
      </span>
    </div>
  );
}
