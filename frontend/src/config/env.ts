/**
 * Frontend runtime configuration.
 *
 * Vite exposes env vars prefixed with VITE_ on import.meta.env.
 */
export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000/api';

/**
 * Server origin without the trailing "/api" — used to build absolute URLs for
 * statically-served files like uploaded cover images (/uploads/...).
 */
export const SERVER_ORIGIN: string = API_URL.replace(/\/api\/?$/, '');

/** Turn a server-relative asset path ("/uploads/x.png") into an absolute URL. */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  return `${SERVER_ORIGIN}${path}`;
}
