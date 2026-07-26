/**
 * Request validation middleware factory (presentation layer).
 *
 * Validates a chosen part of the request (body/query/params) against a zod
 * schema. On success it REPLACES that part with the parsed (cleaned/coerced)
 * data. On failure it throws a ValidationError with field-level details, which
 * the error handler turns into a 400 response.
 */
import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodType } from 'zod';
import { ValidationError } from '../../application/errors/AppError';

type RequestPart = 'body' | 'query' | 'params';

/** Flatten zod issues into a simple { field: message } map for the client. */
function formatIssues(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function validate(schema: ZodType, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      throw new ValidationError('Validation failed', formatIssues(result.error));
    }
    // Store the parsed result on a dedicated property to avoid reassigning
    // req.query (a getter-only property in Express 5).
    if (part === 'body') req.body = result.data;
    else if (part === 'params') (req.params as unknown) = result.data;
    else (req as unknown as { validatedQuery: unknown }).validatedQuery = result.data;
    next();
  };
}
