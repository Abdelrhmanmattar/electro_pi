/**
 * Use case: update a task, only if it belongs to the requesting user.
 */
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository';
import type { ITaskCache } from '../../../domain/services/ITaskCache';
import type { Task, TaskStatus, TaskPriority } from '../../../domain/entities/Task';
import { NotFoundError } from '../../errors/AppError';

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  coverImage?: string | null;
}

export class UpdateTask {
  constructor(
    private readonly tasks: ITaskRepository,
    private readonly cache: ITaskCache
  ) {}

  async execute(taskId: string, userId: string, changes: UpdateTaskInput): Promise<Task> {
    const updated = await this.tasks.updateForUser(taskId, userId, changes);
    if (!updated) {
      // Either it doesn't exist or belongs to someone else — same 404 either way.
      throw new NotFoundError('Task not found');
    }
    await this.cache.invalidateUser(userId);
    return updated;
  }
}
