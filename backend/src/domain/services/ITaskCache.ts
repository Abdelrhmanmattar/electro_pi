/**
 * Contract for caching a user's tasks (domain layer).
 *
 * Design: ONE cache entry per user holds that user's ENTIRE task list. Search,
 * filter and pagination are applied in memory by the GetTasks use case against
 * this list — so any query is served from the cache, and invalidation is a
 * single key delete.
 *
 * Declared here so the application layer depends on the ABSTRACTION, not on
 * Redis. Every method is best-effort: implementations MUST NOT throw if the
 * cache backend is unavailable — they degrade to a miss / no-op so the app
 * keeps working straight from the database.
 */
import type { Task } from '../entities/Task';

export interface ITaskCache {
  /**
   * Return the user's full cached task list, or null on a miss OR if the cache
   * backend is unreachable.
   */
  getAllForUser(userId: string): Promise<Task[] | null>;

  /** Store the user's full task list (best-effort). */
  setAllForUser(userId: string, tasks: Task[]): Promise<void>;

  /**
   * Drop the user's cached list (called after any create/update/delete so the
   * next read is rebuilt from the database). Best-effort.
   */
  invalidateUser(userId: string): Promise<void>;
}
