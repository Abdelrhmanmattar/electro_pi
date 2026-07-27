/**
 * Use case: create a task owned by the given user.
 */
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository';
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
  constructor(private readonly tasks: ITaskRepository) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    return this.tasks.create({
      userId: input.userId,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate,
      coverImage: input.coverImage,
    });
  }
}
