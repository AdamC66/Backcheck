import type { ReactNode } from "react";
import { Row } from "@/components/Row/Row";
import { Text } from "@/components/Text/Text";
import Logo from "@/images/logo.svg";

export interface AppHeaderProps {
  title: string;
  /** Right-hand slot — kept as a prop so the header itself stays auth-agnostic. */
  actions?: ReactNode;
}

export function AppHeader({ title, actions }: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <Row justify="between" className="mx-auto max-w-6xl px-6 py-3">
        <Row justify="start">
          <img src={Logo} alt="backcheck-logo" className="size-8" />
          <Text variant="subheading">{title}</Text>
        </Row>
        {actions}
      </Row>
    </header>
  );
}
