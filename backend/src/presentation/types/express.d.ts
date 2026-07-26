/**
 * Express type augmentation.
 *
 * Adds `userId` to the Request so downstream handlers get it type-safely after
 * the auth middleware has verified the JWT.
 */
import 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      /** Query params after zod validation (Express 5 req.query is read-only). */
      validatedQuery?: unknown;
    }
  }
}

export {};
