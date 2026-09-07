import type { ReactNode } from "react";

export interface InlineCodeProps {
  children: ReactNode;
}

export function InlineCode({ children }: InlineCodeProps) {
  return <code className="bg-slate-100 px-1 font-mono text-[0.9em]">{children}</code>;
}
