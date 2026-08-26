import { request } from "@/lib/apiClient";

export type WorkflowStatus = "backlog" | "todo" | "in_progress" | "blocked" | "done";
export type Priority = "low" | "medium" | "high";
export type TaskType = "feature" | "chore" | "spike" | "bug";

export interface Epic {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: WorkflowStatus;
  priority?: Priority;
  blocked_reason?: string;
}

export interface RoadmapTask {
  id: string;
  epic_id: string;
  title: string;
  description?: string;
  type?: TaskType;
  status: WorkflowStatus;
  priority?: Priority;
  acceptance_criteria?: string[];
}

export interface Roadmap {
  epics: Epic[];
  tasks: RoadmapTask[];
}

export function fetchRoadmap(): Promise<Roadmap> {
  return request<Roadmap>("/admin/roadmap");
}
