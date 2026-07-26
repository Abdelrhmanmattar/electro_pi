/**
 * Central error-handling middleware (presentation layer).
 *
 * The single place that converts thrown errors into JSON HTTP responses.
 * Known AppErrors map to their status code; anything else becomes a safe 500
 * (details are logged server-side, never leaked to the client).
 */
import type { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { AppError, ValidationError } from '../../application/errors/AppError';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const body: ErrorBody = {
      error: { code: err.code, message: err.message },
    };
    if (err instanceof ValidationError && err.details !== undefined) {
      body.error.details = err.details;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  // Multer upload errors (file too large, wrong field, etc.) → 400.
  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 2 MB or smaller' : err.message;
    res.status(400).json({ error: { code: 'UPLOAD_ERROR', message } });
    return;
  }

  // fileFilter rejections come through as a plain Error with our message.
  if (err instanceof Error && err.message.startsWith('Only image files')) {
    res.status(400).json({ error: { code: 'UPLOAD_ERROR', message: err.message } });
    return;
  }

  // Unexpected error — log the real thing, return a generic message.
  console.error('Unhandled error:', err);
  const body: ErrorBody = {
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  };
  res.status(500).json(body);
}

/** 404 handler for unmatched routes. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
}
