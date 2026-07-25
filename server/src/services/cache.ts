import { Redis } from 'ioredis'

const CACHE_TTL = 3600 // 1 hour in seconds

/**
 * Cache-aside pattern: get from cache, miss → fetch from DB → populate cache
 */
export async function getCachedUrl(redis: Redis, shortcode: string): Promise<string | null> {
  const cached = await redis.get(`url:${shortcode}`)
  if (cached) return cached
  return null
}

export async function setCachedUrl(redis: Redis, shortcode: string, longUrl: string): Promise<void> {
  await redis.setex(`url:${shortcode}`, CACHE_TTL, longUrl)
}

export async function invalidateCache(redis: Redis, shortcode: string): Promise<void> {
  await redis.del(`url:${shortcode}`)
}

/**
 * Rate limiting using Redis
 */
export async function checkRateLimit(
  redis: Redis,
  identifier: string,
  limit: number,
  window: number // seconds
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${identifier}`
  const current = await redis.incr(key)
  
  if (current === 1) {
    await redis.expire(key, window)
  }
  
  const remaining = Math.max(0, limit - current)
  return {
    allowed: current <= limit,
    remaining,
  }
}
