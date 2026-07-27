/**
 * Task routes (presentation layer) — ALL protected by the auth middleware.
 *   GET    /api/tasks             list (search + filter + pagination)
 *   POST   /api/tasks             create (JSON, or multipart with an "image" cover)
 *   GET    /api/tasks/:id         read one
 *   PATCH  /api/tasks/:id         update (JSON, or multipart with an "image" cover)
 *   DELETE /api/tasks/:id         delete
 *   POST   /api/tasks/:id/cover   upload a cover image (multipart, field "image")
 *   DELETE /api/tasks/:id/cover   remove the cover image
 */
import { Router, type RequestHandler } from 'express';
import type { TaskController } from '../controllers/TaskController';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validate } from '../middlewares/validate';
import { uploadImage } from '../middlewares/upload';
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
  // uploadImage runs first: for multipart requests it parses the fields + the
  // optional "image" file; for JSON requests it passes through untouched.
  router.post('/', uploadImage, validate(createTaskSchema), asyncHandler(controller.create));
  router.get('/:id', asyncHandler(controller.getOne));
  // uploadImage parses an optional "image" for multipart requests; JSON passes through.
  router.patch('/:id', uploadImage, validate(updateTaskSchema), asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.remove));

  // Cover image (bonus: task attachments). uploadImage runs multer first.
  router.post('/:id/cover', uploadImage, asyncHandler(controller.uploadCover));
  router.delete('/:id/cover', asyncHandler(controller.removeCover));

  return router;
}
