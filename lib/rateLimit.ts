import { getRedis, isRedisAvailable } from "./redis";
import type { Redis } from "@upstash/redis";

// Fallback in-memory rate limiter for local development when Redis is not available
type SlidingWindowEntry = {
  count: number;
  resetAt: number;
};

const inMemoryStores = new Map<string, SlidingWindowEntry>();

// Periodically remove expired keys so that rotating keys (e.g. spoofed
// x-forwarded-for values) cannot grow the Map without bound.
const SWEEP_INTERVAL_MS = 60_000;
let lastSweptAt = 0;

function sweepExpired(now: number): void {
  if (now - lastSweptAt < SWEEP_INTERVAL_MS) return;
  lastSweptAt = now;
  for (const [key, entry] of inMemoryStores) {
    if (now >= entry.resetAt) {
      inMemoryStores.delete(key);
    }
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  // Use the LAST entry of x-forwarded-for: with an appending proxy (nginx
  // `$proxy_add_x_forwarded_for`, Vercel overwriting with the real client IP)
  // the final value is added by the trusted proxy and cannot be forged by the
  // client. Earlier entries are client-controlled and must not be trusted.
  const ip = forwarded?.split(",").pop()?.trim() || realIp || "unknown";
  return ip;
}

/**
 * Redis-based sliding-window rate limiter for an arbitrary key.
 * Falls back to in-memory rate limiting if Redis is not configured.
 * Use this when the thing being limited is not simply the client IP + route
 * (for example, a magic-link request should also be limited per email address).
 */
export async function rateLimitByKey(
  key: string,
  options: { limit: number; windowMs: number }
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const redis = getRedis();

  // Use Redis if available (serverless environments)
  if (redis) {
    return rateLimitWithRedis(redis, key, options);
  }

  // Fallback to in-memory for local development
  return rateLimitInMemory(key, options);
}

/**
 * Redis-based rate limiting using atomic operations.
 * Uses a sliding window algorithm with Redis INCR and EXPIRE.
 */
async function rateLimitWithRedis(
  redis: NonNullable<ReturnType<typeof getRedis>>,
  key: string,
  options: { limit: number; windowMs: number }
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const score = now;

  // Use a sorted set (ZSET) to track request timestamps
  // Remove entries outside the current window
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count requests in the current window
  const count = await redis.zcard(key);

  if (count >= options.limit) {
    // Find the oldest request to calculate retry-after
    const oldest = await redis.zrange(key, 0, 0, { withScores: true });
    if (oldest.length > 0) {
      const oldestEntry = oldest[0] as { score: number };
      const oldestTimestamp = oldestEntry.score;
      const retryAfterMs = oldestTimestamp + options.windowMs - now;
      return { allowed: false, retryAfterMs };
    }
    return { allowed: false, retryAfterMs: options.windowMs };
  }

  // Add current request to the window
  await redis.zadd(key, { score, member: `${now}-${Math.random()}` });

  // Set expiration to clean up old keys
  await redis.expire(key, Math.ceil(options.windowMs / 1000) + 1);

  return { allowed: true };
}

/**
 * In-memory sliding-window rate limiter for local development.
 */
function rateLimitInMemory(
  key: string,
  options: { limit: number; windowMs: number }
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  sweepExpired(now);

  const entry = inMemoryStores.get(key);

  if (!entry || now >= entry.resetAt) {
    inMemoryStores.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return { allowed: true };
  }

  if (entry.count >= options.limit) {
    return {
      allowed: false,
      retryAfterMs: entry.resetAt - now,
    };
  }

  entry.count += 1;
  return { allowed: true };
}

/**
 * Sliding-window rate limiter, keyed per client IP and per route
 * (`METHOD:/path`) so each endpoint enforces its own independent limit.
 * Uses Redis if available, otherwise falls back to in-memory.
 * Pass `label` to create a separate counter for a sub-path of handling
 * (e.g. throttling CSRF failures before the handler's own limit).
 */
export async function rateLimit(
  request: Request,
  options: { limit: number; windowMs: number; label?: string }
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const url = new URL(request.url);
  const key = `${getClientIp(request)}:${options.label ?? `${request.method}:${url.pathname}`}`;
  return rateLimitByKey(key, options);
}
