/**
 * Sliding-window in-memory rate limiter.
 *
 * Each key tracks an array of request timestamps.  On every call we
 * discard timestamps older than `windowMs`, then accept or reject based
 * on how many remain.
 *
 * Trade-off: state is per-process, so this does not work across multiple
 * server instances.  To scale horizontally, replace `store` with an
 * Upstash Redis client and use the same interface.
 */

export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window. */
  limit: number
  /** Rolling time window in milliseconds. */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  /** How many requests the caller may still make in the current window. */
  remaining: number
  /** Unix ms timestamp at which the oldest slot in the window expires. */
  resetAt: number
}

// Exported so tests can clear it between cases.
export const store = new Map<string, number[]>()

// Periodically remove keys that have no recent activity to prevent unbounded
// memory growth on long-running servers.
const CLEANUP_INTERVAL_MS = 60_000
/* c8 ignore next 10 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cutoff = Date.now() - CLEANUP_INTERVAL_MS
    for (const [key, timestamps] of store) {
      if (timestamps.every((t) => t < cutoff)) {
        store.delete(key)
      }
    }
  }, CLEANUP_INTERVAL_MS).unref?.()  // .unref() prevents the timer from keeping a Node process alive
}

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowStart = now - config.windowMs

  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart)

  const resetAt =
    timestamps.length > 0
      ? timestamps[0] + config.windowMs  // oldest slot expires first
      : now + config.windowMs

  if (timestamps.length >= config.limit) {
    store.set(key, timestamps)
    return { allowed: false, remaining: 0, resetAt }
  }

  timestamps.push(now)
  store.set(key, timestamps)

  return { allowed: true, remaining: config.limit - timestamps.length, resetAt }
}

/**
 * Build standard rate-limit response headers.
 * Attach these to both allowed AND rejected responses so clients can
 * implement back-off without waiting for a 429.
 */
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
