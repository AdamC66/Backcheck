import { Row } from "@/components/Row/Row";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import type { Epic, Priority, RoadmapTask, WorkflowStatus } from "@/models/roadmap";
import { useRoadmap } from "@/models/useRoadmap";

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

const STATUS_CLASS: Record<WorkflowStatus, string> = {
  backlog: "bg-slate-100 text-slate-600",
  todo: "bg-sky-100 text-sky-700",
  in_progress: "bg-amber-100 text-amber-700",
  blocked: "bg-red-100 text-red-700",
  done: "bg-emerald-100 text-emerald-700",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

function epicNumber(id: string) {
  return Number(id.split("-")[1] ?? 0);
}

function groupByEpic(tasks: RoadmapTask[]) {
  const grouped: Record<string, RoadmapTask[]> = {};

  tasks.forEach((task) => {
    const list = grouped[task.epic_id] ?? [];
    list.push(task);
    grouped[task.epic_id] = list;
  });

  return grouped;
}

function StatusPill({ status }: { status: WorkflowStatus }) {
  return (
    <span
      className={`px-2 py-0.5 text-xs font-semibold tracking-wide uppercase ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function TaskRow({ task }: { task: RoadmapTask }) {
  return (
    <Row justify="between" className="border-b border-slate-100 py-2 last:border-b-0">
      <Stack gap="xs">
        <Text variant="label">{task.title}</Text>
        <Text tone="muted" variant="caption">
          {task.id}
          {task.priority === undefined ? "" : ` · ${PRIORITY_LABELS[task.priority]} priority`}
        </Text>
      </Stack>
      <StatusPill status={task.status} />
    </Row>
  );
}

function EpicCard({ epic, tasks }: { epic: Epic; tasks: RoadmapTask[] }) {
  const doneCount = tasks.filter((task) => task.status === "done").length;

  return (
    <Stack gap="sm" className="border border-slate-200 bg-white p-4">
      <Row justify="between" align="start">
        <Stack gap="xs">
          <Text variant="label">
            {epic.id} — {epic.title}
          </Text>
          {tasks.length === 0 ? null : (
            <Text tone="muted" variant="caption">
              {doneCount}/{tasks.length} tasks done
            </Text>
          )}
        </Stack>
        <StatusPill status={epic.status} />
      </Row>

      {tasks.length === 0 ? null : (
        <Stack gap="none">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export function RoadmapPage() {
  const roadmap = useRoadmap();

  if (roadmap.isPending) {
    return <Text tone="muted">Loading roadmap…</Text>;
  }

  if (roadmap.isError) {
    return <Text tone="danger">Could not load the roadmap.</Text>;
  }

  const epics = [...roadmap.data.epics].sort((a, b) => epicNumber(a.id) - epicNumber(b.id));
  const tasksByEpic = groupByEpic(roadmap.data.tasks);

  return (
    <Stack gap="md">
      <Text variant="subheading">Roadmap</Text>

      <Stack gap="sm">
        {epics.map((epic) => (
          <EpicCard key={epic.id} epic={epic} tasks={tasksByEpic[epic.id] ?? []} />
        ))}
      </Stack>
    </Stack>
  );
}
