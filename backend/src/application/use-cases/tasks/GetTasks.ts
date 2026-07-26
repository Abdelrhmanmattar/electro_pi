/**
 * Use case: list the current user's tasks with search, filter and pagination.
 *
 * Covers requirements #8 (search by title) and #9 (filter by status/priority).
 */
import type { ITaskRepository, PaginatedTasks } from '../../../domain/repositories/ITaskRepository';
import type { TaskStatus, TaskPriority } from '../../../domain/entities/Task';

export interface GetTasksInput {
  userId: string;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  page?: number;
  limit?: number;
}

export class GetTasks {
  constructor(private readonly tasks: ITaskRepository) {}

  async execute(input: GetTasksInput): Promise<PaginatedTasks> {
    return this.tasks.findMany({
      userId: input.userId,
      search: input.search,
      status: input.status,
      priority: input.priority,
      page: input.page,
      limit: input.limit,
    });
  }
}
