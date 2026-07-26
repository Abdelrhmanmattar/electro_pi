/**
 * Use case: fetch the currently-authenticated user's profile.
 *
 * Used by GET /api/auth/me so the frontend can restore a session from a token.
 */
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { toPublicUser, type PublicUser } from '../../../domain/entities/User';
import { UnauthorizedError } from '../../errors/AppError';

export class GetCurrentUser {
  constructor(private readonly users: IUserRepository) {}

  async execute(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      // Token was valid but the user no longer exists.
      throw new UnauthorizedError('User no longer exists');
    }
    return toPublicUser(user);
  }
}
