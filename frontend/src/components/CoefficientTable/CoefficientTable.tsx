import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";

export interface CoefficientTableProps {
  coefficients: Record<string, number>;
}

export function CoefficientTable({ coefficients }: CoefficientTableProps) {
  const entries = Object.entries(coefficients);
  if (entries.length === 0) return null;

  return (
    <Stack gap="none" className="border border-slate-200">
      {entries.map(([term, weight]) => (
        <Row
          key={term}
          justify="between"
          className="border-b border-slate-100 px-3 py-1.5 last:border-b-0"
        >
          <Text variant="caption" className="font-mono">
            {term}
          </Text>
          <Text variant="caption" className="font-mono">
            {weight.toFixed(4)}
          </Text>
        </Row>
      ))}
    </Stack>
  );
}
