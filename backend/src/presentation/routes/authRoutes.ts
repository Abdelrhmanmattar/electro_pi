/**
 * Auth routes (presentation layer).
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   GET  /api/auth/me      (protected)
 */
import { Router, type RequestHandler } from 'express';
import type { AuthController } from '../controllers/AuthController';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../validation/authSchemas';

export function createAuthRoutes(controller: AuthController, authMiddleware: RequestHandler): Router {
  const router = Router();

  router.post('/register', validate(registerSchema), asyncHandler(controller.register));
  router.post('/login', validate(loginSchema), asyncHandler(controller.login));
  router.get('/me', authMiddleware, asyncHandler(controller.me));

  return router;
}
