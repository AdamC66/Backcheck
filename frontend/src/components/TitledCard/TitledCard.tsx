import type { ReactNode } from "react";
import { Card } from "@/components/Card/Card";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";

export interface TitledCardProps {
  title: string;
  children: ReactNode;
}

export function TitledCard({ title, children }: TitledCardProps) {
  return (
    <Card padding="lg">
      <Stack gap="sm">
        <Text variant="title">{title}</Text>
        {children}
      </Stack>
    </Card>
  );
}
