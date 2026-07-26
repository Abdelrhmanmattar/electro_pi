/**
 * bcrypt implementation of IPasswordHasher (infrastructure layer).
 *
 * Uses bcryptjs (pure JS — no native build tools needed on Windows).
 * A cost factor of 10 is a sensible default balancing security and speed.
 */
import bcrypt from 'bcryptjs';
import type { IPasswordHasher } from '../../domain/services/IPasswordHasher';

const SALT_ROUNDS = 10;

export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
