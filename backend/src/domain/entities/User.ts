/**
 * Domain entity: User
 *
 * Pure business object — no framework/database dependencies.
 * Passwords are always stored hashed (bcrypt) — the domain never holds plaintext
 * beyond the moment of registration/login input.
 */

/** The core User entity as understood by the business rules. */
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // bcrypt hash — never the plaintext
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A User safe to expose over the API / return to the client.
 * Deliberately omits passwordHash so it can never leak through a controller.
 */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

/** Fields required to create a new user (during registration). */
export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
}

/** Maps a full User to the API-safe shape. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}
