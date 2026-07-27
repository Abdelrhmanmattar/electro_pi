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
import type { SetTaskCover } from '../../application/use-cases/tasks/SetTaskCover';
import type { IFileStorage } from '../../domain/services/IFileStorage';
import { UnauthorizedError, ValidationError } from '../../application/errors/AppError';
import { toTaskResponse } from '../dto/taskDto';
import type { CreateTaskBody, UpdateTaskBody, ListTasksQuery } from '../validation/taskSchemas';

export class TaskController {
  constructor(
    private readonly createTask: CreateTask,
    private readonly getTasks: GetTasks,
    private readonly getTaskById: GetTaskById,
    private readonly updateTask: UpdateTask,
    private readonly deleteTask: DeleteTask,
    private readonly setTaskCover: SetTaskCover,
    private readonly storage: IFileStorage
  ) {}

  private userId(req: Request): string {
    if (!req.userId) throw new UnauthorizedError();
    return req.userId;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateTaskBody;
    const userId = this.userId(req);
    // If the request was multipart with an "image" file, attach it as the cover.
    const coverImage = req.file ? this.storage.publicPath(req.file.filename) : null;
    const task = await this.createTask.execute({ userId, ...body, coverImage });
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
    const userId = this.userId(req);
    // Split the cover intent (removeCover flag + uploaded file) from the field
    // updates. The rest of `body` are the task fields to patch.
    const { removeCover, ...fields } = req.body as UpdateTaskBody;

    const hasFieldChanges = Object.keys(fields).length > 0;
    const hasNewCover = !!req.file;
    const wantsRemoveCover = removeCover === true;

    if (!hasFieldChanges && !hasNewCover && !wantsRemoveCover) {
      throw new ValidationError('At least one field must be provided');
    }

    let task = await this.getTaskById.execute(id, userId); // 404s if not owned

    if (hasFieldChanges) {
      task = await this.updateTask.execute(id, userId, fields);
    }

    // Cover: a newly uploaded image wins; otherwise honor an explicit removal.
    if (hasNewCover && req.file) {
      task = await this.setTaskCover.execute(id, userId, this.storage.publicPath(req.file.filename));
    } else if (wantsRemoveCover) {
      task = await this.setTaskCover.execute(id, userId, null);
    }

    res.status(200).json({ task: toTaskResponse(task) });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await this.deleteTask.execute(id, this.userId(req));
    res.status(204).send();
  };

  /** POST /api/tasks/:id/cover — multipart upload of a cover image. */
  uploadCover = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    if (!req.file) {
      throw new ValidationError('No image file provided', { image: 'An image file is required' });
    }
    const coverPath = this.storage.publicPath(req.file.filename);
    const task = await this.setTaskCover.execute(id, this.userId(req), coverPath);
    res.status(200).json({ task: toTaskResponse(task) });
  };

  /** DELETE /api/tasks/:id/cover — remove the cover image. */
  removeCover = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const task = await this.setTaskCover.execute(id, this.userId(req), null);
    res.status(200).json({ task: toTaskResponse(task) });
  };
}
