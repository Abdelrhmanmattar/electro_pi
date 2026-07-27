/**
 * Use case: list the current user's tasks with search, filter and pagination.
 *
 * Covers requirements #8 (search by title) and #9 (filter by status/priority).
 *
 * Caching strategy: ONE cache entry holds the user's ENTIRE task list. We read
 * that full list (from cache, or the DB on a miss), then apply search, filter
 * and pagination IN MEMORY here. Benefits: any query is served from a single
 * cached entry, and invalidation is one key delete. The in-memory logic mirrors
 * the repository's Mongo query exactly so cached and uncached results match.
 *
 * The cache is best-effort — if Redis is down, getAllForUser() returns null (a
 * miss) and we read the full list from the database as normal.
 */
import type { ITaskRepository, PaginatedTasks } from '../../../domain/repositories/ITaskRepository';
import type { ITaskCache } from '../../../domain/services/ITaskCache';
import type { Task, TaskStatus, TaskPriority } from '../../../domain/entities/Task';

export interface GetTasksInput {
  userId: string;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  page?: number;
  limit?: number;
}

export class GetTasks {
  constructor(
    private readonly tasks: ITaskRepository,
    private readonly cache: ITaskCache
  ) {}

  async execute(input: GetTasksInput): Promise<PaginatedTasks> {
    // 1) Get the user's FULL task list — from cache, or DB on a miss.
    let all = await this.cache.getAllForUser(input.userId);
    if (all === null) {
      all = await this.tasks.findAllForUser(input.userId);
      await this.cache.setAllForUser(input.userId, all); // populate (best-effort)
    }

    // 2) Apply search + filters in memory (mirrors the Mongo query semantics).
    const filtered = applyFilters(all, input);

    // 3) Paginate in memory with the same clamps the repository uses.
    return paginate(filtered, input.page, input.limit);
  }
}

/** Case-insensitive substring match on title + exact status/priority filters. */
function applyFilters(tasks: Task[], input: GetTasksInput): Task[] {
  const search = input.search?.trim().toLowerCase() ?? '';
  return tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search)) return false;
    if (input.status && t.status !== input.status) return false;
    if (input.priority && t.priority !== input.priority) return false;
    return true;
  });
}

/** Slice a page out of the list, matching the repository's page/limit clamps. */
function paginate(items: Task[], pageInput?: number, limitInput?: number): PaginatedTasks {
  const page = Math.max(1, pageInput ?? 1);
  const limit = Math.min(100, Math.max(1, limitInput ?? 20));
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total: items.length, // total AFTER filtering (same as Mongo countDocuments(filter))
    page,
    limit,
  };
}
