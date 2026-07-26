/**
 * Contract for authentication tokens (domain layer).
 *
 * Declared here so use cases depend on the ABSTRACTION, not on jsonwebtoken.
 * The concrete JWT implementation lives in infrastructure/security.
 */

/** The claims we embed in / read back from a token. */
export interface TokenPayload {
  userId: string;
}

export interface ITokenService {
  /** Sign a token carrying the given payload. */
  sign(payload: TokenPayload): string;

  /** Verify + decode a token. Throws if invalid/expired. */
  verify(token: string): TokenPayload;
}
