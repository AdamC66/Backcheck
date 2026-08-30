import { useState } from "react";
import { Row } from "@/components/Row/Row";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
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

type Scope = "open" | "all";

const SCOPE_OPTIONS: { value: Scope; label: string }[] = [
  { value: "open", label: "Open work" },
  { value: "all", label: "Everything" },
];

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

function EpicCard({
  epic,
  tasks,
  visibleTasks,
}: {
  epic: Epic;
  tasks: RoadmapTask[];
  visibleTasks: RoadmapTask[];
}) {
  const doneCount = tasks.filter((task) => task.status === "done").length;
  const hiddenDone = tasks.length - visibleTasks.length;

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
              {hiddenDone > 0 ? ` · ${hiddenDone} completed hidden` : ""}
            </Text>
          )}
        </Stack>
        <StatusPill status={epic.status} />
      </Row>

      {visibleTasks.length === 0 ? null : (
        <Stack gap="none">
          {visibleTasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export function RoadmapPage() {
  const roadmap = useRoadmap();
  const [scope, setScope] = useState<Scope>("open");

  if (roadmap.isPending) {
    return <Text tone="muted">Loading roadmap…</Text>;
  }

  if (roadmap.isError) {
    return <Text tone="danger">Could not load the roadmap.</Text>;
  }

  const epics = [...roadmap.data.epics].sort((a, b) => epicNumber(a.id) - epicNumber(b.id));
  const tasksByEpic = groupByEpic(roadmap.data.tasks);

  const cards = epics
    .map((epic) => {
      const tasks = tasksByEpic[epic.id] ?? [];
      const visibleTasks = scope === "all" ? tasks : tasks.filter((task) => task.status !== "done");
      return { epic, tasks, visibleTasks };
    })
    .filter(({ epic, tasks, visibleTasks }) => {
      if (scope === "all") return true;
      // Open scope: keep an epic only if it still has work — either it isn't done,
      // or a task under it isn't (e.g. a blocked follow-up under a shipped epic).
      return epic.status !== "done" || visibleTasks.length > 0 || tasks.length === 0;
    });

  return (
    <Stack gap="md">
      <Row justify="between" align="center">
        <Text variant="subheading">Roadmap</Text>
        <SegmentedControl
          label="Roadmap scope"
          options={SCOPE_OPTIONS}
          value={scope}
          onChange={setScope}
        />
      </Row>

      {cards.length === 0 ? (
        <Text tone="muted">No open work — switch to Everything to review completed epics.</Text>
      ) : (
        <Stack gap="sm">
          {cards.map(({ epic, tasks, visibleTasks }) => (
            <EpicCard key={epic.id} epic={epic} tasks={tasks} visibleTasks={visibleTasks} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
