/**
 * Frontend runtime configuration.
 *
 * Vite exposes env vars prefixed with VITE_ on import.meta.env.
 */
export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000/api';
