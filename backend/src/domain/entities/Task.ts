/**
 * Domain entity: Task
 *
 * Pure business object — no framework/database dependencies (Clean Architecture inner layer).
 * The task requirements state every task must have:
 *   title, description, status, priority, due date  — plus ownership (userId).
 */

/** Available statuses (task requirement #6). */
export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Available priorities (task requirement #7). */
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/**
 * Human-readable labels for the UI / API mapping.
 * The DB stores the machine value ('in_progress'); the UI shows 'In Progress'.
 */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

/**
 * The core Task entity as understood by the business rules.
 * `id` and `userId` are strings at the domain level so the domain never
 * depends on Mongoose's ObjectId type.
 */
export interface Task {
  id: string;
  userId: string; // owner — enforces "users access only their own tasks" (requirement #3)
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  coverImage: string | null; // relative path to the uploaded cover image (bonus)
  createdAt: Date;
  updatedAt: Date;
}

/** Fields required to create a new task (id/timestamps are generated). */
export interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  coverImage?: string | null;
}

/** Fields that may be updated on an existing task (all optional). */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  coverImage?: string | null;
}

/** Query criteria for search + filtering (requirements #8 and #9). */
export interface TaskQuery {
  userId: string;
  search?: string; // matches against title
  status?: TaskStatus;
  priority?: TaskPriority;
  page?: number; // pagination (bonus)
  limit?: number;
}
