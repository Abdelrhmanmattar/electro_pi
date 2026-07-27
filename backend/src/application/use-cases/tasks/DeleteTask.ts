/**
 * Use case: delete a task, only if it belongs to the requesting user.
 */
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository';
import type { ITaskCache } from '../../../domain/services/ITaskCache';
import { NotFoundError } from '../../errors/AppError';

export class DeleteTask {
  constructor(
    private readonly tasks: ITaskRepository,
    private readonly cache: ITaskCache
  ) {}

  async execute(taskId: string, userId: string): Promise<void> {
    const deleted = await this.tasks.deleteForUser(taskId, userId);
    if (!deleted) {
      throw new NotFoundError('Task not found');
    }
    await this.cache.invalidateUser(userId);
  }
}
