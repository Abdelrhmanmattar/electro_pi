/**
 * Wraps an async route handler so any rejected promise is forwarded to the
 * Express error handler via next(err).
 *
 * Express 5 forwards rejections from async handlers automatically in most
 * cases, but wrapping is explicit and works uniformly — no reliance on version
 * quirks.
 */
import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(fn: AsyncFn): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
