/**
 * Redis connection management (infrastructure layer).
 *
 * Creates a single shared node-redis client. Crucially, the app must run fine
 * even when Redis is DOWN — so:
 *   - connection errors are logged, not thrown (an unhandled 'error' event
 *     would otherwise crash the process);
 *   - a reconnect strategy keeps trying in the background with a capped delay;
 *   - `isReady` lets callers skip Redis entirely while it's unavailable.
 */
import { createClient, type RedisClientType } from 'redis';
import { env } from '../../config/env';

let client: RedisClientType | null = null;
let ready = false;

export function getRedis(): RedisClientType | null {
  if (!env.REDIS_URL) return null; // caching disabled by config
  if (client) return client;

  client = createClient({
    url: env.REDIS_URL,
    socket: {
      // Back off up to 3s between retries; never give up (background retries).
      reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      connectTimeout: 3000,
    },
  });

  // Without an 'error' listener, node-redis throws on connection errors and
  // can crash the process. We log once and let the reconnect strategy handle it.
  client.on('error', (err: Error) => {
    if (ready) console.warn('⚠️  Redis error:', err.message);
    ready = false;
  });
  client.on('ready', () => {
    ready = true;
    console.log('✅ Redis connected (task caching enabled)');
  });
  client.on('end', () => {
    ready = false;
  });

  return client;
}

/**
 * Kick off the Redis connection at startup WITHOUT blocking.
 *
 * We deliberately do NOT `await` connect(): with a reconnect strategy that
 * keeps retrying, the initial connect() promise may never settle while Redis
 * is down, which would hang server startup. Instead we fire it in the
 * background — the app starts immediately and caching switches on if/when
 * Redis becomes reachable (isRedisReady() gates all cache use until then).
 */
export function connectRedis(): void {
  const c = getRedis();
  if (!c) {
    console.log('ℹ️  REDIS_URL not set — task caching disabled');
    return;
  }
  c.connect().catch((err: Error) => {
    console.warn(
      `⚠️  Redis unavailable at startup (${err.message}). ` +
        'Continuing without cache — will retry in the background.'
    );
  });
}

/** True only when Redis is connected and ready to serve commands. */
export function isRedisReady(): boolean {
  return ready;
}

export async function disconnectRedis(): Promise<void> {
  if (client && ready) {
    await client.quit().catch(() => {
      /* ignore */
    });
  }
  client = null;
  ready = false;
}
