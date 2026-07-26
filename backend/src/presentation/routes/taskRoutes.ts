/**
 * Task routes (presentation layer) — ALL protected by the auth middleware.
 *   GET    /api/tasks         list (search + filter + pagination)
 *   POST   /api/tasks         create
 *   GET    /api/tasks/:id     read one
 *   PATCH  /api/tasks/:id     update
 *   DELETE /api/tasks/:id     delete
 */
import { Router, type RequestHandler } from 'express';
import type { TaskController } from '../controllers/TaskController';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validate } from '../middlewares/validate';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
} from '../validation/taskSchemas';

export function createTaskRoutes(controller: TaskController, authMiddleware: RequestHandler): Router {
  const router = Router();

  // Every task route requires a valid token.
  router.use(authMiddleware);

  router.get('/', validate(listTasksQuerySchema, 'query'), asyncHandler(controller.list));
  router.post('/', validate(createTaskSchema), asyncHandler(controller.create));
  router.get('/:id', asyncHandler(controller.getOne));
  router.patch('/:id', validate(updateTaskSchema), asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.remove));

  return router;
}
