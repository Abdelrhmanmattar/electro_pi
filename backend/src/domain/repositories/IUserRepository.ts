/**
 * Repository contract for User persistence.
 *
 * Declared in the domain layer; implemented in infrastructure (MongoUserRepository).
 * Use cases depend on THIS interface, never on Mongoose — the dependency
 * inversion that keeps the business logic database-agnostic and testable.
 */
import type { User, CreateUserInput } from '../entities/User';

export interface IUserRepository {
  /** Create a new user. Throws if the email already exists (unique index). */
  create(input: CreateUserInput): Promise<User>;

  /** Find a user by email. Returns null if not found. */
  findByEmail(email: string): Promise<User | null>;

  /** Find a user by id. Returns null if not found. */
  findById(id: string): Promise<User | null>;

  /** True if a user with this email already exists (used for pre-checks). */
  existsByEmail(email: string): Promise<boolean>;
}
