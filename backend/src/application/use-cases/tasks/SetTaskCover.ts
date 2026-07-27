/**
 * Use case: set or remove a task's cover image.
 *
 * - Verifies the task belongs to the user (404 otherwise).
 * - When a new cover is set, deletes the previous file (best-effort cleanup).
 * - Passing coverPath = null removes the cover (and deletes the file).
 */
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository';
import type { IFileStorage } from '../../../domain/services/IFileStorage';
import type { ITaskCache } from '../../../domain/services/ITaskCache';
import type { Task } from '../../../domain/entities/Task';
import { NotFoundError } from '../../errors/AppError';

export class SetTaskCover {
  constructor(
    private readonly tasks: ITaskRepository,
    private readonly storage: IFileStorage,
    private readonly cache: ITaskCache
  ) {}

  async execute(taskId: string, userId: string, coverPath: string | null): Promise<Task> {
    const existing = await this.tasks.findByIdForUser(taskId, userId);
    if (!existing) {
      throw new NotFoundError('Task not found');
    }

    const updated = await this.tasks.updateForUser(taskId, userId, { coverImage: coverPath });
    if (!updated) {
      throw new NotFoundError('Task not found');
    }

    // Remove the old file if it was replaced or cleared.
    if (existing.coverImage && existing.coverImage !== coverPath) {
      await this.storage.remove(existing.coverImage);
    }

    await this.cache.invalidateUser(userId);
    return updated;
  }
}
