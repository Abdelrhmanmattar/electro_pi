/**
 * Zod schemas for task request validation (presentation layer).
 */
import { z } from 'zod';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../domain/entities/Task';

const statusEnum = z.enum(TASK_STATUSES);
const priorityEnum = z.enum(TASK_PRIORITIES);

/**
 * With multipart/form-data, optional fields left blank arrive as empty strings
 * ("") rather than being absent. This turns "" into undefined BEFORE the enum
 * check so a blank status/priority falls back to the model default instead of
 * failing validation. (Harmless for JSON requests, where the field is absent.)
 */
const blankToUndefined = (v: unknown) => (v === '' ? undefined : v);
const optionalStatus = z.preprocess(blankToUndefined, statusEnum.optional());
const optionalPriority = z.preprocess(blankToUndefined, priorityEnum.optional());

/**
 * A due date coming from JSON is a string (or null / omitted). Coerce it to a
 * Date and reject invalid dates.
 *
 * CREATE variant: an omitted dueDate collapses to `null` (new tasks have no due
 * date by default).
 */
const createDueDateSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null || val === '') return null;
    return new Date(val);
  })
  .refine((d) => d === null || !Number.isNaN(d.getTime()), {
    message: 'Invalid due date',
  });

/**
 * UPDATE variant: preserves the absent/null distinction so a PATCH only touches
 * dueDate when the client actually sends it:
 *   - key omitted       -> undefined  (leave unchanged)
 *   - null or ""        -> null       (explicitly clear it)
 *   - "2026-08-01"      -> Date
 */
const updateDueDateSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined; // not provided → don't touch it
    if (val === null || val === '') return null; // explicit clear
    return new Date(val);
  })
  .refine((d) => d === undefined || d === null || !Number.isNaN(d.getTime()), {
    message: 'Invalid due date',
  });

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title is too long'),
  description: z.string().trim().max(2000, 'Description is too long').optional(),
  status: optionalStatus,
  priority: optionalPriority,
  dueDate: createDueDateSchema,
});

/**
 * Coerce form-data's string "true"/"false" (and real booleans from JSON) into a
 * boolean. Used for the removeCover flag.
 */
const optionalBool = z.preprocess((v) => {
  if (v === undefined) return undefined;
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0' || v === '') return false;
  return v;
}, z.boolean().optional());

/**
 * Update allows any subset of fields. At least one field OR a cover change
 * (a newly uploaded image, checked in the controller, or removeCover) must be
 * present — see the controller, which also counts an uploaded file.
 */
export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  status: optionalStatus,
  priority: optionalPriority,
  dueDate: updateDueDateSchema,
  removeCover: optionalBool,
});

/** Query params for listing: search + filters + pagination. */
export const listTasksQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type CreateTaskBody = z.infer<typeof createTaskSchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
