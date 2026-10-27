import { getRedis, isRedisAvailable } from "./redis";

// Fallback in-memory cache for local development when Redis is not available
type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const inMemoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Get a cached value by key.
 * Uses Redis if available, otherwise falls back to in-memory cache.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedis();

  // Use Redis if available (serverless environments)
  if (redis) {
    return getCachedFromRedis<T>(redis, key);
  }

  // Fallback to in-memory for local development
  return getCachedFromMemory<T>(key);
}

/**
 * Set a cached value with TTL.
 * Uses Redis if available, otherwise falls back to in-memory cache.
 */
export async function setCache<T>(key: string, value: T, ttlMs: number): Promise<void> {
  const redis = getRedis();

  // Use Redis if available (serverless environments)
  if (redis) {
    await setCacheInRedis<T>(redis, key, value, ttlMs);
    return;
  }

  // Fallback to in-memory for local development
  setCacheInMemory<T>(key, value, ttlMs);
}

/**
 * Clear a cached value or all cached values.
 * Uses Redis if available, otherwise falls back to in-memory cache.
 */
export async function clearCache(key?: string): Promise<void> {
  const redis = getRedis();

  // Use Redis if available (serverless environments)
  if (redis) {
    if (key) {
      await redis.del(key);
    } else {
      // Clear all keys with a specific prefix to avoid deleting system keys
      const keys = await redis.keys("cache:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
    return;
  }

  // Fallback to in-memory for local development
  if (key) {
    inMemoryCache.delete(key);
  } else {
    inMemoryCache.clear();
  }
}

/**
 * Redis-based cache operations.
 */
async function getCachedFromRedis<T>(
  redis: NonNullable<ReturnType<typeof getRedis>>,
  key: string
): Promise<T | null> {
  try {
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    console.error("Redis cache get error:", error);
    return null;
  }
}

async function setCacheInRedis<T>(
  redis: NonNullable<ReturnType<typeof getRedis>>,
  key: string,
  value: T,
  ttlMs: number
): Promise<void> {
  try {
    await redis.set(key, value, { px: ttlMs });
  } catch (error) {
    console.error("Redis cache set error:", error);
  }
}

/**
 * In-memory cache operations for local development.
 */
function getCachedFromMemory<T>(key: string): T | null {
  const entry = inMemoryCache.get(key);
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    inMemoryCache.delete(key);
    return null;
  }

  return entry.value as T;
}

function setCacheInMemory<T>(key: string, value: T, ttlMs: number): void {
  inMemoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}
