/**
 * Task HTTP controller (presentation layer).
 *
 * Thin adapter over the task use cases. Every handler uses req.userId (set by
 * the auth middleware) so a user only ever operates on their own tasks.
 */
import type { Request, Response } from 'express';
import type { CreateTask } from '../../application/use-cases/tasks/CreateTask';
import type { GetTasks } from '../../application/use-cases/tasks/GetTasks';
import type { GetTaskById } from '../../application/use-cases/tasks/GetTaskById';
import type { UpdateTask } from '../../application/use-cases/tasks/UpdateTask';
import type { DeleteTask } from '../../application/use-cases/tasks/DeleteTask';
import { UnauthorizedError } from '../../application/errors/AppError';
import { toTaskResponse } from '../dto/taskDto';
import type { CreateTaskBody, UpdateTaskBody, ListTasksQuery } from '../validation/taskSchemas';

export class TaskController {
  constructor(
    private readonly createTask: CreateTask,
    private readonly getTasks: GetTasks,
    private readonly getTaskById: GetTaskById,
    private readonly updateTask: UpdateTask,
    private readonly deleteTask: DeleteTask
  ) {}

  private userId(req: Request): string {
    if (!req.userId) throw new UnauthorizedError();
    return req.userId;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateTaskBody;
    const task = await this.createTask.execute({ userId: this.userId(req), ...body });
    res.status(201).json({ task: toTaskResponse(task) });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const query = (req.validatedQuery ?? {}) as ListTasksQuery;
    const result = await this.getTasks.execute({ userId: this.userId(req), ...query });
    res.status(200).json({
      tasks: result.items.map(toTaskResponse),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
    });
  };

  getOne = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const task = await this.getTaskById.execute(id, this.userId(req));
    res.status(200).json({ task: toTaskResponse(task) });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const body = req.body as UpdateTaskBody;
    const task = await this.updateTask.execute(id, this.userId(req), body);
    res.status(200).json({ task: toTaskResponse(task) });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await this.deleteTask.execute(id, this.userId(req));
    res.status(204).send();
  };
}
