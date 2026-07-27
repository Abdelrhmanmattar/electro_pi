/**
 * Redis implementation of ITaskCache (infrastructure layer).
 *
 * ONE key per user — "tasks:<userId>" — holds that user's entire task list as
 * JSON. The GetTasks use case does search/filter/pagination in memory against
 * this list, so:
 *   - any query is served from a single cached entry (high hit rate);
 *   - invalidation is a single DEL (no key-index bookkeeping needed).
 *
 * Best-effort: if Redis is not ready or a command throws, getAllForUser()
 * returns null (a miss) and the others no-op, so the caller falls back to the
 * database. The app never breaks on Redis-down. Task dates are revived from
 * ISO strings on read (JSON loses Date types).
 */
import type { ITaskCache } from '../../domain/services/ITaskCache';
import type { Task } from '../../domain/entities/Task';
import { getRedis, isRedisReady } from './redisClient';

const TTL_SECONDS = 300; // 5-minute safety net; invalidation is the primary path

export class RedisTaskCache implements ITaskCache {
  private key(userId: string): string {
    return `tasks:${userId}`;
  }

  async getAllForUser(userId: string): Promise<Task[] | null> {
    if (!isRedisReady()) return null;
    const client = getRedis();
    if (!client) return null;
    try {
      const raw = await client.get(this.key(userId));
      if (!raw) return null;
      return reviveTasks(JSON.parse(raw) as Task[]);
    } catch {
      return null; // treat any error as a miss → fall back to DB
    }
  }

  async setAllForUser(userId: string, tasks: Task[]): Promise<void> {
    if (!isRedisReady()) return;
    const client = getRedis();
    if (!client) return;
    try {
      await client.set(this.key(userId), JSON.stringify(tasks), { EX: TTL_SECONDS });
    } catch {
      /* best-effort: ignore */
    }
  }

  async invalidateUser(userId: string): Promise<void> {
    if (!isRedisReady()) return;
    const client = getRedis();
    if (!client) return;
    try {
      await client.del(this.key(userId));
    } catch {
      /* best-effort: ignore */
    }
  }
}

/** JSON has no Date type — turn the ISO strings back into Date objects. */
function reviveTasks(tasks: Task[]): Task[] {
  return tasks.map(
    (t): Task => ({
      ...t,
      dueDate: t.dueDate ? new Date(t.dueDate) : null,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
    })
  );
}
