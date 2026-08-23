import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader/AppHeader";

const WIDTH_CLASS = {
  default: "mx-auto w-full max-w-6xl p-6",
  wide: "mx-auto w-full max-w-7xl p-6",
  // Edge-to-edge, no padding — for a page building its own full-height layout
  // (a sidebar), rather than centered page content.
  full: "flex",
} as const;

export type PageWidth = keyof typeof WIDTH_CLASS;

export interface PageShellProps {
  children: ReactNode;
  actions?: ReactNode;
  width?: PageWidth;
}

export function PageShell({ children, actions, width = "default" }: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader title="Backcheck" actions={actions} />

      <main className={`flex-1 ${WIDTH_CLASS[width]}`}>{children}</main>
    </div>
  );
}
