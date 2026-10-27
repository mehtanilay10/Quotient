import { Redis } from "@upstash/redis";

let redisInstance: Redis | null = null;

/**
 * Get or create a Redis client instance.
 * Uses environment variables to connect to Upstash Redis.
 * Falls back to null if Redis is not configured (for local development).
 */
export function getRedis(): Redis | null {
  if (redisInstance) {
    return redisInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Redis not configured - this is acceptable for local development
    return null;
  }

  redisInstance = new Redis({
    url,
    token,
  });

  return redisInstance;
}

/**
 * Check if Redis is available and configured.
 */
export function isRedisAvailable(): boolean {
  return getRedis() !== null;
}
