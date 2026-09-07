import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { XgActiveModelCard } from "@/components/XgActiveModelCard/XgActiveModelCard";
import { XgTrainingRunCard } from "@/components/XgTrainingRunCard/XgTrainingRunCard";
import { useXgModelDashboard } from "@/models/useXgModelDashboard";

export function XgModelPage() {
  const dashboard = useXgModelDashboard();

  if (dashboard.isPending) {
    return <Text tone="muted">Loading xG model…</Text>;
  }

  if (dashboard.isError) {
    return <Text tone="danger">Could not load the xG model.</Text>;
  }

  const { active_model, training_runs } = dashboard.data;

  return (
    <Stack gap="md">
      <Text variant="subheading">xG Model</Text>

      <XgActiveModelCard model={active_model} />

      <Stack gap="sm">
        <Text variant="title">Training runs</Text>
        {training_runs.length === 0 ? (
          <Text tone="muted">
            No training runs yet. Run <span className="font-mono">rake xg:export_training_set</span>
            .
          </Text>
        ) : (
          training_runs.map((run) => <XgTrainingRunCard key={run.id} run={run} />)
        )}
      </Stack>
    </Stack>
  );
}
