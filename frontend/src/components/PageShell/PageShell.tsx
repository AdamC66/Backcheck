import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader/AppHeader";

export interface PageShellProps {
  children: ReactNode;
  /** Right-hand header slot — the account menu on every page so far. */
  actions?: ReactNode;
}

export function PageShell({ children, actions }: PageShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader title="Backcheck" actions={actions} />

      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
