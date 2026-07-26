/**
 * Application-level errors (application layer).
 *
 * Use cases throw these domain-meaningful errors instead of HTTP-specific ones.
 * The presentation layer's error handler maps them to HTTP status codes, so the
 * business logic never imports Express.
 */

/** Base class carrying an HTTP-ish status code and a stable error code. */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    // Restore prototype chain (needed when targeting ES built-ins).
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 400 — the request was understood but invalid. */
export class ValidationError extends AppError {
  public readonly details?: unknown;
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
    if (details !== undefined) this.details = details;
  }
}

/** 401 — missing/invalid credentials or token. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/** 404 — the requested resource does not exist (or isn't visible to this user). */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/** 409 — a conflict such as a duplicate unique field (email already taken). */
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}
