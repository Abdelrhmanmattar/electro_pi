/**
 * Task response DTO mapping (presentation layer).
 *
 * Converts the domain Task (machine values like 'in_progress') into the JSON
 * shape sent to the client, including human-readable labels for the UI.
 */
import type { Task } from '../../domain/entities/Task';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../domain/entities/Task';

export interface TaskResponse {
  id: string;
  title: string;
  description: string;
  status: string;
  statusLabel: string;
  priority: string;
  priorityLabel: string;
  dueDate: string | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toTaskResponse(task: Task): TaskResponse {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    statusLabel: TASK_STATUS_LABELS[task.status],
    priority: task.priority,
    priorityLabel: TASK_PRIORITY_LABELS[task.priority],
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    coverImage: task.coverImage,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
