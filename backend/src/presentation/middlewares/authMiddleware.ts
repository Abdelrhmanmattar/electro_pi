/**
 * JWT authentication middleware (presentation layer).
 *
 * Extracts the Bearer token, verifies it via ITokenService, and attaches
 * req.userId. Protects every route it's mounted on (requirement #2).
 */
import type { Request, Response, NextFunction } from 'express';
import type { ITokenService } from '../../domain/services/ITokenService';
import { UnauthorizedError } from '../../application/errors/AppError';

export function makeAuthMiddleware(tokens: ITokenService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token is missing');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedError('Authentication token is missing');
    }

    try {
      const payload = tokens.verify(token);
      req.userId = payload.userId;
      next();
    } catch {
      // Invalid signature, malformed, or expired.
      throw new UnauthorizedError('Invalid or expired token');
    }
  };
}
