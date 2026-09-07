import { Card } from "@/components/Card/Card";
import { CoefficientTable } from "@/components/CoefficientTable/CoefficientTable";
import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import type { XgModelSummary } from "@/models/adminXgModel";

export interface XgActiveModelCardProps {
  model: XgModelSummary | null;
}

export function XgActiveModelCard({ model }: XgActiveModelCardProps) {
  return (
    <Card>
      <Stack gap="sm">
        <Text variant="title">Active model</Text>
        {model === null ? (
          <Text tone="muted">No model is active.</Text>
        ) : (
          <>
            <Row justify="between">
              <Text variant="label">{model.version}</Text>
              <Text tone="muted" variant="caption">
                trained {new Date(model.trained_at).toLocaleDateString()}
              </Text>
            </Row>
            <CoefficientTable coefficients={model.coefficients} />
          </>
        )}
      </Stack>
    </Card>
  );
}
