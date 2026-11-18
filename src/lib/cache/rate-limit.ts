import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasRedisEnv =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 600000 // 10 minutes default
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (hasRedisEnv) {
    try {
      const redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });

      const ratelimit = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(limit, "10 m"),
        analytics: true,
      });

      const result = await ratelimit.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (err) {
      console.warn("Upstash ratelimit error, falling back to memory:", err);
    }
  }

  // In-memory sliding window fallback
  const now = Date.now();
  const bucket = memoryBuckets.get(identifier);

  if (!bucket || now > bucket.resetAt) {
    memoryBuckets.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    };
  }

  if (bucket.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: bucket.resetAt,
    };
  }

  bucket.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - bucket.count,
    reset: bucket.resetAt,
  };
}
