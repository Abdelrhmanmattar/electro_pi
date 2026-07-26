/**
 * Axios instance + interceptors.
 *
 * - Request interceptor attaches the stored JWT as a Bearer token.
 * - Response interceptor clears the token on 401 so the app falls back to login.
 * - getErrorMessage() turns any thrown error into a user-friendly string,
 *   understanding the backend's { error: { code, message, details } } shape.
 */
import axios, { AxiosError } from 'axios';
import { API_URL } from '../config/env';
import type { ApiErrorBody } from '../types';

const TOKEN_KEY = 'taskapp_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, drop the (now invalid) token. A listener re-renders the app to /login.
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

/** Extract a human-readable message (and optional field errors) from an error. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?';
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

/** Extract field-level validation errors ({ field: message }) if present. */
export function getFieldErrors(error: unknown): Record<string, string> | null {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.error?.details && typeof body.error.details === 'object') {
      return body.error.details;
    }
  }
  return null;
}
