import type { ReactNode } from "react";
import { Text } from "@/components/Text/Text";

export interface ListProps {
  items: ReactNode[];
  ordered?: boolean;
}

export function List({ items, ordered = false }: ListProps) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`space-y-1 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}>
      {items.map((item, index) => (
        <li key={index}>
          <Text tone="muted" variant="body">
            {item}
          </Text>
        </li>
      ))}
    </Tag>
  );
}
