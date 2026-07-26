/**
 * Contract for password hashing (domain layer).
 *
 * Declared here so use cases depend on the ABSTRACTION, not on bcrypt directly.
 * The concrete bcrypt implementation lives in infrastructure/security.
 */
export interface IPasswordHasher {
  /** Hash a plaintext password. */
  hash(plain: string): Promise<string>;

  /** Compare a plaintext password against a stored hash. */
  compare(plain: string, hash: string): Promise<boolean>;
}
