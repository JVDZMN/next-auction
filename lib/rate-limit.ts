/**
 * Rate limiter with Redis (Upstash) in production and in-memory fallback
 * for local development when UPSTASH_REDIS_REST_URL is not configured.
 *
 * Production: uses Upstash sliding-window — works correctly across multiple
 * serverless instances and survives cold starts.
 *
 * Development / no-Redis: falls back to an in-memory Map (per-process only).
 * Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in .env to use Redis.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export interface RateLimitConfig {
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// ---------------------------------------------------------------------------
// Redis-backed limiter (production)
// ---------------------------------------------------------------------------

function makeRedisLimiter(config: RateLimitConfig) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, `${config.windowMs}ms`),
    prefix: 'rl',
  })
}

// Cache limiter instances so we don't recreate on every request
const redisLimiters = new Map<string, Ratelimit>()

async function redisRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const cacheKey = `${config.limit}:${config.windowMs}`
  if (!redisLimiters.has(cacheKey)) {
    redisLimiters.set(cacheKey, makeRedisLimiter(config))
  }
  const limiter = redisLimiters.get(cacheKey)!
  const { success, remaining, reset } = await limiter.limit(key)
  return { allowed: success, remaining, resetAt: reset }
}

// ---------------------------------------------------------------------------
// In-memory fallback (development)
// ---------------------------------------------------------------------------

// Exported for tests to clear between cases
export const store = new Map<string, number[]>()

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cutoff = Date.now() - 60_000
    for (const [key, timestamps] of store) {
      if (timestamps.every((t) => t < cutoff)) store.delete(key)
    }
  }, 60_000).unref?.()
}

function memoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowStart = now - config.windowMs
  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart)
  const resetAt = timestamps.length > 0 ? timestamps[0] + config.windowMs : now + config.windowMs

  if (timestamps.length >= config.limit) {
    store.set(key, timestamps)
    return { allowed: false, remaining: 0, resetAt }
  }
  timestamps.push(now)
  store.set(key, timestamps)
  return { allowed: true, remaining: config.limit - timestamps.length, resetAt }
}

// ---------------------------------------------------------------------------
// Unified export
// ---------------------------------------------------------------------------

const useRedis =
  typeof process.env.UPSTASH_REDIS_REST_URL === 'string' &&
  process.env.UPSTASH_REDIS_REST_URL.length > 0

export async function rateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  if (useRedis) {
    try {
      return await redisRateLimit(key, config)
    } catch {
      // Redis unavailable — degrade gracefully to in-memory
      return memoryRateLimit(key, config)
    }
  }
  return memoryRateLimit(key, config)
}

export function rateLimitHeaders(
  result: RateLimitResult,
  config: RateLimitConfig,
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(config.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
    ...(result.allowed ? {} : { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) }),
  }
}
