/**
 * Use case: fetch a single task, only if it belongs to the requesting user.
 */
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository';
import type { Task } from '../../../domain/entities/Task';
import { NotFoundError } from '../../errors/AppError';

export class GetTaskById {
  constructor(private readonly tasks: ITaskRepository) {}

  async execute(taskId: string, userId: string): Promise<Task> {
    const task = await this.tasks.findByIdForUser(taskId, userId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }
    return task;
  }
}
