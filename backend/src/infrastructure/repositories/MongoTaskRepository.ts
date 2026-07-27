/**
 * Mongoose implementation of ITaskRepository (infrastructure layer).
 *
 * Every method is scoped by userId so ownership is enforced at the data layer.
 * Handles search (by title), filtering (status/priority) and pagination.
 */
import { Types } from 'mongoose';
import { TaskModel } from '../models/TaskModel';
import type { ITaskRepository, PaginatedTasks } from '../../domain/repositories/ITaskRepository';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskQuery,
  TaskStatus,
  TaskPriority,
} from '../../domain/entities/Task';

/** Shape of a lean task document as stored in Mongo. */
interface RawTask {
  _id: unknown;
  userId: unknown;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toDomain(raw: RawTask): Task {
  return {
    id: String(raw._id),
    userId: String(raw.userId),
    title: raw.title,
    description: raw.description,
    status: raw.status,
    priority: raw.priority,
    dueDate: raw.dueDate,
    coverImage: raw.coverImage ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/** Guard against invalid ObjectId strings causing a Mongoose CastError. */
function isValidId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

/** Escape user input before using it in a regex (prevents ReDoS / injection). */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class MongoTaskRepository implements ITaskRepository {
  async create(input: CreateTaskInput): Promise<Task> {
    const doc = await TaskModel.create({
      userId: new Types.ObjectId(input.userId),
      title: input.title,
      description: input.description ?? '',
      status: input.status ?? 'todo',
      priority: input.priority ?? 'medium',
      dueDate: input.dueDate ?? null,
      coverImage: input.coverImage ?? null,
    });
    return toDomain(doc.toObject() as RawTask);
  }

  async findByIdForUser(id: string, userId: string): Promise<Task | null> {
    if (!isValidId(id)) return null;
    const raw = await TaskModel.findOne({ _id: id, userId })
      .lean<RawTask | null>()
      .exec();
    return raw ? toDomain(raw) : null;
  }

  async findMany(query: TaskQuery): Promise<PaginatedTasks> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    // Build the filter — always scoped to the owner.
    const filter: Record<string, unknown> = { userId: query.userId };

    if (query.search && query.search.trim() !== '') {
      // Case-insensitive partial match on title (requirement #8).
      filter.title = { $regex: escapeRegex(query.search.trim()), $options: 'i' };
    }
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;

    // Run count + page query together.
    const [rawItems, total] = await Promise.all([
      TaskModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<RawTask[]>()
        .exec(),
      TaskModel.countDocuments(filter).exec(),
    ]);

    return {
      items: rawItems.map(toDomain),
      total,
      page,
      limit,
    };
  }

  async findAllForUser(userId: string): Promise<Task[]> {
    // Newest-first, same order as findMany, so in-memory pagination matches.
    const raw = await TaskModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean<RawTask[]>()
      .exec();
    return raw.map(toDomain);
  }

  async updateForUser(
    id: string,
    userId: string,
    changes: UpdateTaskInput
  ): Promise<Task | null> {
    if (!isValidId(id)) return null;

    // Only set fields that were actually provided (avoid overwriting with undefined).
    const update: Record<string, unknown> = {};
    if (changes.title !== undefined) update.title = changes.title;
    if (changes.description !== undefined) update.description = changes.description;
    if (changes.status !== undefined) update.status = changes.status;
    if (changes.priority !== undefined) update.priority = changes.priority;
    if (changes.dueDate !== undefined) update.dueDate = changes.dueDate;
    if (changes.coverImage !== undefined) update.coverImage = changes.coverImage;

    const raw = await TaskModel.findOneAndUpdate(
      { _id: id, userId }, // scoped update — can't touch another user's task
      { $set: update },
      { new: true, runValidators: true }
    )
      .lean<RawTask | null>()
      .exec();

    return raw ? toDomain(raw) : null;
  }

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    if (!isValidId(id)) return false;
    const result = await TaskModel.deleteOne({ _id: id, userId }).exec();
    return result.deletedCount === 1;
  }
}
