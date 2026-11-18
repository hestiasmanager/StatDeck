import { Redis } from "@upstash/redis";

// In-memory fallback cache for development or when Redis env vars are absent
const inMemoryCache = new Map<string, { value: unknown; expiresAt: number }>();

const hasRedisEnv =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const realRedis = hasRedisEnv
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export const redis = {
  async get<T>(key: string): Promise<T | null> {
    if (realRedis) {
      try {
        return await realRedis.get<T>(key);
      } catch (err) {
        console.warn("Upstash Redis get error, using fallback:", err);
      }
    }

    const item = inMemoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      inMemoryCache.delete(key);
      return null;
    }
    return item.value as T;
  },

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<void> {
    if (realRedis) {
      try {
        if (options?.ex) {
          await realRedis.set(key, value, { ex: options.ex });
        } else {
          await realRedis.set(key, value);
        }
        return;
      } catch (err) {
        console.warn("Upstash Redis set error, using fallback:", err);
      }
    }

    const ttlMs = (options?.ex ?? 604800) * 1000;
    inMemoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  },
};
