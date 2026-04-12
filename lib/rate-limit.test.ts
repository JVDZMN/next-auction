import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { rateLimit, rateLimitHeaders, store } from './rate-limit'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONFIG_5_IN_10S = { limit: 5, windowMs: 10_000 }
const CONFIG_2_IN_1S  = { limit: 2, windowMs: 1_000  }

function clearStore() {
  store.clear()
}

// ---------------------------------------------------------------------------
// rateLimit — core behaviour
// ---------------------------------------------------------------------------

describe('rateLimit', () => {
  beforeEach(clearStore)

  it('allows the first request', () => {
    const result = rateLimit('user:1', CONFIG_5_IN_10S)
    expect(result.allowed).toBe(true)
  })

  it('counts remaining slots correctly', () => {
    rateLimit('user:1', CONFIG_5_IN_10S) // 1st
    const result = rateLimit('user:1', CONFIG_5_IN_10S) // 2nd
    expect(result.remaining).toBe(3) // 5 - 2 = 3
  })

  it('allows exactly `limit` requests before blocking', () => {
    for (let i = 0; i < CONFIG_5_IN_10S.limit; i++) {
      expect(rateLimit('user:1', CONFIG_5_IN_10S).allowed).toBe(true)
    }
    expect(rateLimit('user:1', CONFIG_5_IN_10S).allowed).toBe(false)
  })

  it('returns remaining = 0 and allowed = false when limit is exceeded', () => {
    for (let i = 0; i <= CONFIG_5_IN_10S.limit; i++) {
      rateLimit('user:1', CONFIG_5_IN_10S)
    }
    const result = rateLimit('user:1', CONFIG_5_IN_10S)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('isolates limits by key — different users do not share a counter', () => {
    for (let i = 0; i < CONFIG_2_IN_1S.limit; i++) {
      rateLimit('user:A', CONFIG_2_IN_1S)
    }
    // user:A is exhausted but user:B should still be fine
    expect(rateLimit('user:A', CONFIG_2_IN_1S).allowed).toBe(false)
    expect(rateLimit('user:B', CONFIG_2_IN_1S).allowed).toBe(true)
  })

  it('resets after the window expires', () => {
    vi.useFakeTimers()

    for (let i = 0; i < CONFIG_2_IN_1S.limit; i++) {
      rateLimit('user:1', CONFIG_2_IN_1S)
    }
    expect(rateLimit('user:1', CONFIG_2_IN_1S).allowed).toBe(false)

    // Advance past the window
    vi.advanceTimersByTime(CONFIG_2_IN_1S.windowMs + 1)

    expect(rateLimit('user:1', CONFIG_2_IN_1S).allowed).toBe(true)

    vi.useRealTimers()
  })

  it('provides a resetAt in the future when blocked', () => {
    for (let i = 0; i <= CONFIG_2_IN_1S.limit; i++) {
      rateLimit('user:1', CONFIG_2_IN_1S)
    }
    const result = rateLimit('user:1', CONFIG_2_IN_1S)
    expect(result.resetAt).toBeGreaterThan(Date.now())
  })

  it('does not count rejected requests against the limit', () => {
    // Fill to the limit
    for (let i = 0; i < CONFIG_2_IN_1S.limit; i++) {
      rateLimit('user:1', CONFIG_2_IN_1S)
    }
    // These are all rejections — they must NOT push new timestamps
    rateLimit('user:1', CONFIG_2_IN_1S)
    rateLimit('user:1', CONFIG_2_IN_1S)
    rateLimit('user:1', CONFIG_2_IN_1S)

    vi.useFakeTimers()
    vi.advanceTimersByTime(CONFIG_2_IN_1S.windowMs + 1)

    // After window expires the slate is clean — full limit available again
    let allowed = 0
    for (let i = 0; i < CONFIG_2_IN_1S.limit; i++) {
      if (rateLimit('user:1', CONFIG_2_IN_1S).allowed) allowed++
    }
    expect(allowed).toBe(CONFIG_2_IN_1S.limit)

    vi.useRealTimers()
  })
})

// ---------------------------------------------------------------------------
// rateLimitHeaders
// ---------------------------------------------------------------------------

describe('rateLimitHeaders', () => {
  beforeEach(clearStore)
  afterEach(() => vi.useRealTimers())

  it('includes X-RateLimit-Limit, Remaining, Reset for an allowed result', () => {
    const result = rateLimit('user:1', CONFIG_5_IN_10S)
    const headers = rateLimitHeaders(result, CONFIG_5_IN_10S)

    expect(headers['X-RateLimit-Limit']).toBe('5')
    expect(headers['X-RateLimit-Remaining']).toBe(String(result.remaining))
    expect(headers['X-RateLimit-Reset']).toBe(String(result.resetAt))
    expect(headers['Retry-After']).toBeUndefined()
  })

  it('includes Retry-After (in seconds) for a blocked result', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    for (let i = 0; i <= CONFIG_2_IN_1S.limit; i++) {
      rateLimit('user:1', CONFIG_2_IN_1S)
    }
    const result = rateLimit('user:1', CONFIG_2_IN_1S)
    const headers = rateLimitHeaders(result, CONFIG_2_IN_1S)

    expect(result.allowed).toBe(false)
    expect(headers['Retry-After']).toBeDefined()
    const retryAfter = parseInt(headers['Retry-After'], 10)
    expect(retryAfter).toBeGreaterThan(0)
    expect(retryAfter).toBeLessThanOrEqual(Math.ceil(CONFIG_2_IN_1S.windowMs / 1000))
  })

  it('Retry-After is absent when the request is allowed', () => {
    const result = rateLimit('user:1', CONFIG_5_IN_10S)
    expect(result.allowed).toBe(true)
    const headers = rateLimitHeaders(result, CONFIG_5_IN_10S)
    expect('Retry-After' in headers).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Bid-specific scenario (mirrors the route's 5-per-10s config)
// ---------------------------------------------------------------------------

describe('bid rate limit scenario', () => {
  beforeEach(clearStore)
  afterEach(() => vi.useRealTimers())

  it('allows 5 bids in a row then rejects the 6th', () => {
    const config = { limit: 5, windowMs: 10_000 }
    for (let i = 1; i <= 5; i++) {
      expect(rateLimit(`bid:user-1`, config).allowed).toBe(true)
    }
    expect(rateLimit(`bid:user-1`, config).allowed).toBe(false)
  })

  it('two users bidding concurrently do not interfere', () => {
    const config = { limit: 5, windowMs: 10_000 }
    // User A uses all 5 slots
    for (let i = 0; i < 5; i++) rateLimit('bid:user-A', config)
    expect(rateLimit('bid:user-A', config).allowed).toBe(false)

    // User B is unaffected
    expect(rateLimit('bid:user-B', config).allowed).toBe(true)
  })

  it('a user can bid again after the window resets', () => {
    vi.useFakeTimers()
    const config = { limit: 5, windowMs: 10_000 }

    for (let i = 0; i < 5; i++) rateLimit('bid:user-1', config)
    expect(rateLimit('bid:user-1', config).allowed).toBe(false)

    vi.advanceTimersByTime(10_001)
    expect(rateLimit('bid:user-1', config).allowed).toBe(true)
  })
})
