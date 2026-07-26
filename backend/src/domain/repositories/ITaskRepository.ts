/**
 * Repository contract for Task persistence.
 *
 * Declared in the domain layer; implemented in infrastructure (MongoTaskRepository).
 * Every method is scoped by userId so ownership ("users access only their own
 * tasks", requirement #3) is enforced at the data-access boundary — not left
 * to individual controllers to remember.
 */
import type { Task, CreateTaskInput, UpdateTaskInput, TaskQuery } from '../entities/Task';

/** Result of a paginated task query. */
export interface PaginatedTasks {
  items: Task[];
  total: number; // total matching documents (before pagination)
  page: number;
  limit: number;
}

export interface ITaskRepository {
  /** Create a task owned by input.userId. */
  create(input: CreateTaskInput): Promise<Task>;

  /**
   * Find one task by id, scoped to an owner.
   * Returns null if it doesn't exist OR belongs to another user — the caller
   * cannot distinguish the two, which prevents ownership enumeration.
   */
  findByIdForUser(id: string, userId: string): Promise<Task | null>;

  /** List tasks for a user with search/filter/pagination (requirements #8, #9). */
  findMany(query: TaskQuery): Promise<PaginatedTasks>;

  /**
   * Update a task owned by userId. Returns the updated task, or null if it
   * doesn't exist or isn't owned by the user.
   */
  updateForUser(id: string, userId: string, changes: UpdateTaskInput): Promise<Task | null>;

  /**
   * Delete a task owned by userId. Returns true if a document was deleted,
   * false if nothing matched (missing or not owned).
   */
  deleteForUser(id: string, userId: string): Promise<boolean>;
}
