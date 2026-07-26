/**
 * jsonwebtoken implementation of ITokenService (infrastructure layer).
 */
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { ITokenService, TokenPayload } from '../../domain/services/ITokenService';
import { env } from '../../config/env';

export class JwtTokenService implements ITokenService {
  private readonly secret: string = env.JWT_SECRET;
  private readonly expiresIn = env.JWT_EXPIRES_IN as SignOptions['expiresIn'];

  sign(payload: TokenPayload): string {
    return jwt.sign({ userId: payload.userId }, this.secret, {
      expiresIn: this.expiresIn,
    });
  }

  verify(token: string): TokenPayload {
    // jwt.verify throws on invalid/expired tokens — callers map that to 401.
    const decoded = jwt.verify(token, this.secret) as jwt.JwtPayload;
    return { userId: String(decoded.userId) };
  }
}
