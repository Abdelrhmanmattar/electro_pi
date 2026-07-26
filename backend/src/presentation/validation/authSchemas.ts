/**
 * Zod schemas for auth request validation (presentation layer).
 *
 * Backend validation of all incoming data is a task requirement. These run in
 * the `validate` middleware before the controller, so use cases receive
 * already-clean input.
 */
import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters'),
  email: z.email('A valid email is required').max(254),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

export const loginSchema = z.object({
  email: z.email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
