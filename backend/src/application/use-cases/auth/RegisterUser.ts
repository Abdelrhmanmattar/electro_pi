/**
 * Use case: register a new user.
 *
 * Business rules:
 *  - email must be unique (409 if taken)
 *  - password is hashed with bcrypt before storage (never stored plaintext)
 *  - returns a signed JWT + the public (hash-free) user
 */
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher';
import type { ITokenService } from '../../../domain/services/ITokenService';
import { toPublicUser, type PublicUser } from '../../../domain/entities/User';
import { ConflictError } from '../../errors/AppError';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export class RegisterUser {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokens: ITokenService
  ) {}

  async execute(input: RegisterUserInput): Promise<AuthResult> {
    const email = input.email.toLowerCase().trim();

    if (await this.users.existsByEmail(email)) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await this.hasher.hash(input.password);

    const user = await this.users.create({
      name: input.name.trim(),
      email,
      passwordHash,
    });

    const token = this.tokens.sign({ userId: user.id });
    return { token, user: toPublicUser(user) };
  }
}
