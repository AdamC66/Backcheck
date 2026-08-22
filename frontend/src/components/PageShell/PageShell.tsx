import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader/AppHeader";

const WIDTH_CLASS = {
  default: "max-w-6xl",
  wide: "max-w-7xl",
} as const;

export type PageWidth = keyof typeof WIDTH_CLASS;

export interface PageShellProps {
  children: ReactNode;
  actions?: ReactNode;
  width?: PageWidth;
}

export function PageShell({ children, actions, width = "default" }: PageShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader title="Backcheck" actions={actions} />

      <main className={`mx-auto ${WIDTH_CLASS[width]} p-6`}>{children}</main>
    </div>
  );
}
