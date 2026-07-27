/**
 * Use case: create a task owned by the given user.
 */
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository';
import type { ITaskCache } from '../../../domain/services/ITaskCache';
import type { Task, TaskStatus, TaskPriority } from '../../../domain/entities/Task';

export interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  coverImage?: string | null;
}

export class CreateTask {
  constructor(
    private readonly tasks: ITaskRepository,
    private readonly cache: ITaskCache
  ) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    const task = await this.tasks.create({
      userId: input.userId,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate,
      coverImage: input.coverImage,
    });
    // The user's cached lists are now stale — drop them.
    await this.cache.invalidateUser(input.userId);
    return task;
  }
}
