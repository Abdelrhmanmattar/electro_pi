/**
 * Use case: authenticate an existing user.
 *
 * Business rules:
 *  - a wrong email and a wrong password return the SAME generic 401 message,
 *    so an attacker can't tell which accounts exist (no user enumeration)
 *  - returns a signed JWT + the public user on success
 */
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher';
import type { ITokenService } from '../../../domain/services/ITokenService';
import { toPublicUser } from '../../../domain/entities/User';
import { UnauthorizedError } from '../../errors/AppError';
import type { AuthResult } from './RegisterUser';

export interface LoginUserInput {
  email: string;
  password: string;
}

export class LoginUser {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokens: ITokenService
  ) {}

  async execute(input: LoginUserInput): Promise<AuthResult> {
    const email = input.email.toLowerCase().trim();
    const user = await this.users.findByEmail(email);

    // Same error whether the email is unknown or the password is wrong.
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await this.hasher.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.tokens.sign({ userId: user.id });
    return { token, user: toPublicUser(user) };
  }
}
