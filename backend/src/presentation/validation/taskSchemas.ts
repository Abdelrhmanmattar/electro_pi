/**
 * Zod schemas for task request validation (presentation layer).
 */
import { z } from 'zod';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../domain/entities/Task';

const statusEnum = z.enum(TASK_STATUSES);
const priorityEnum = z.enum(TASK_PRIORITIES);

/**
 * A due date coming from JSON is a string (or null / omitted). Coerce it to a
 * Date and reject invalid dates.
 */
const dueDateSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null || val === '') return null;
    const d = new Date(val);
    return d;
  })
  .refine((d) => d === null || !Number.isNaN(d.getTime()), {
    message: 'Invalid due date',
  });

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title is too long'),
  description: z.string().trim().max(2000, 'Description is too long').optional(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  dueDate: dueDateSchema,
});

/** Update allows any subset of fields, but at least one must be present. */
export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1, 'Title cannot be empty').max(120).optional(),
    description: z.string().trim().max(2000).optional(),
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    dueDate: dueDateSchema,
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one field must be provided',
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
