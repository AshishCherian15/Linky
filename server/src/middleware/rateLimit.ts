import { Request, Response, NextFunction } from 'express'
import { Redis } from 'ioredis'
import { checkRateLimit } from '../services/cache'

export interface RateLimitOptions {
  windowMs: number
  maxRequests: number
  keyPrefix?: string
}

export function rateLimit(redis: Redis, options: RateLimitOptions) {
  const { windowMs, maxRequests, keyPrefix = 'rate_limit' } = options
  const windowSeconds = Math.ceil(windowMs / 1000)

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use IP address as key (hash it for privacy)
      const ip = req.ip || req.connection.remoteAddress || 'unknown'
      const key = `${keyPrefix}:${ip}`

      const result = await checkRateLimit(redis, key, maxRequests, windowSeconds)

      if (!result.allowed) {
        return res.status(429).json({
          error: 'Too many requests. Please try again later.',
        })
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString())
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString())
      res.setHeader('X-RateLimit-Window', `${windowSeconds}s`)

      next()
    } catch (error) {
      console.error('Rate limit error:', error)
      // Fail open - allow request if rate limit check fails
      next()
    }
  }
}
