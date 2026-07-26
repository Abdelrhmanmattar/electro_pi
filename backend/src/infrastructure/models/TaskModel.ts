/**
 * Mongoose model (schema) for Task — the "migration" for the tasks collection.
 *
 * Infrastructure layer: the ONLY place the Task's MongoDB shape is defined.
 * Enum values mirror the domain constants so the DB rejects invalid states,
 * giving defense-in-depth alongside the zod request validation.
 */
import { Schema, model, Types, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../domain/entities/Task';

const taskSchema = new Schema(
  {
    // Owner reference — enforces per-user ownership (requirement #3).
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: TASK_STATUSES, // ['todo','in_progress','done']
      default: 'todo',
      required: true,
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES, // ['low','medium','high']
      default: 'medium',
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    // Relative path to the uploaded cover image, e.g. "/uploads/<file>.jpg".
    // Null when the task has no cover.
    coverImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index: the common access pattern is "this user's tasks, filtered".
// Indexing (userId, status, priority) makes the list/filter query efficient.
taskSchema.index({ userId: 1, status: 1, priority: 1 });
// Support search-by-title within a user's tasks.
taskSchema.index({ userId: 1, title: 1 });

export type TaskDoc = HydratedDocument<InferSchemaType<typeof taskSchema>>;
export { Types };

export const TaskModel = model('Task', taskSchema);
