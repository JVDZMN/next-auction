import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { rateLimit, rateLimitHeaders, store } from './rate-limit'

const CONFIG_5_IN_10S = { limit: 5, windowMs: 10_000 }
const CONFIG_2_IN_1S  = { limit: 2, windowMs: 1_000  }

function clearStore() { store.clear() }

// ---------------------------------------------------------------------------
// rateLimit — core behaviour (in-memory path; Redis env vars absent in tests)
// ---------------------------------------------------------------------------

describe('rateLimit', () => {
  beforeEach(clearStore)

  it('allows the first request', async () => {
    const result = await rateLimit('user:1', CONFIG_5_IN_10S)
    expect(result.allowed).toBe(true)
  })

  it('counts remaining slots correctly', async () => {
    await rateLimit('user:1', CONFIG_5_IN_10S) // 1st
    const result = await rateLimit('user:1', CONFIG_5_IN_10S) // 2nd
    expect(result.remaining).toBe(3)
  })

  it('allows exactly `limit` requests before blocking', async () => {
    for (let i = 0; i < CONFIG_5_IN_10S.limit; i++) {
      expect((await rateLimit('user:1', CONFIG_5_IN_10S)).allowed).toBe(true)
    }
    expect((await rateLimit('user:1', CONFIG_5_IN_10S)).allowed).toBe(false)
  })

  it('returns remaining = 0 and allowed = false when limit is exceeded', async () => {
    for (let i = 0; i <= CONFIG_5_IN_10S.limit; i++) {
      await rateLimit('user:1', CONFIG_5_IN_10S)
    }
    const result = await rateLimit('user:1', CONFIG_5_IN_10S)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('isolates limits by key — different users do not share a counter', async () => {
    for (let i = 0; i < CONFIG_2_IN_1S.limit; i++) {
      await rateLimit('user:A', CONFIG_2_IN_1S)
    }
    expect((await rateLimit('user:A', CONFIG_2_IN_1S)).allowed).toBe(false)
    expect((await rateLimit('user:B', CONFIG_2_IN_1S)).allowed).toBe(true)
  })

  it('resets after the window expires', async () => {
    vi.useFakeTimers()
    for (let i = 0; i < CONFIG_2_IN_1S.limit; i++) {
      await rateLimit('user:1', CONFIG_2_IN_1S)
    }
    expect((await rateLimit('user:1', CONFIG_2_IN_1S)).allowed).toBe(false)
    vi.advanceTimersByTime(CONFIG_2_IN_1S.windowMs + 1)
    expect((await rateLimit('user:1', CONFIG_2_IN_1S)).allowed).toBe(true)
    vi.useRealTimers()
  })

  it('provides a resetAt in the future when blocked', async () => {
    for (let i = 0; i <= CONFIG_2_IN_1S.limit; i++) {
      await rateLimit('user:1', CONFIG_2_IN_1S)
    }
    const result = await rateLimit('user:1', CONFIG_2_IN_1S)
    expect(result.resetAt).toBeGreaterThan(Date.now())
  })

  it('does not count rejected requests against the limit', async () => {
    for (let i = 0; i < CONFIG_2_IN_1S.limit; i++) {
      await rateLimit('user:1', CONFIG_2_IN_1S)
    }
    await rateLimit('user:1', CONFIG_2_IN_1S)
    await rateLimit('user:1', CONFIG_2_IN_1S)
    await rateLimit('user:1', CONFIG_2_IN_1S)

    vi.useFakeTimers()
    vi.advanceTimersByTime(CONFIG_2_IN_1S.windowMs + 1)

    let allowed = 0
    for (let i = 0; i < CONFIG_2_IN_1S.limit; i++) {
      if ((await rateLimit('user:1', CONFIG_2_IN_1S)).allowed) allowed++
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

  it('includes X-RateLimit-Limit, Remaining, Reset for an allowed result', async () => {
    const result = await rateLimit('user:1', CONFIG_5_IN_10S)
    const headers = rateLimitHeaders(result, CONFIG_5_IN_10S)
    expect(headers['X-RateLimit-Limit']).toBe('5')
    expect(headers['X-RateLimit-Remaining']).toBe(String(result.remaining))
    expect(headers['X-RateLimit-Reset']).toBe(String(result.resetAt))
    expect(headers['Retry-After']).toBeUndefined()
  })

  it('includes Retry-After (in seconds) for a blocked result', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.now())
    for (let i = 0; i <= CONFIG_2_IN_1S.limit; i++) {
      await rateLimit('user:1', CONFIG_2_IN_1S)
    }
    const result = await rateLimit('user:1', CONFIG_2_IN_1S)
    const headers = rateLimitHeaders(result, CONFIG_2_IN_1S)
    expect(result.allowed).toBe(false)
    expect(headers['Retry-After']).toBeDefined()
    const retryAfter = parseInt(headers['Retry-After'], 10)
    expect(retryAfter).toBeGreaterThan(0)
    expect(retryAfter).toBeLessThanOrEqual(Math.ceil(CONFIG_2_IN_1S.windowMs / 1000))
  })

  it('Retry-After is absent when the request is allowed', async () => {
    const result = await rateLimit('user:1', CONFIG_5_IN_10S)
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

  it('allows 5 bids in a row then rejects the 6th', async () => {
    const config = { limit: 5, windowMs: 10_000 }
    for (let i = 1; i <= 5; i++) {
      expect((await rateLimit(`bid:user-1`, config)).allowed).toBe(true)
    }
    expect((await rateLimit(`bid:user-1`, config)).allowed).toBe(false)
  })

  it('two users bidding concurrently do not interfere', async () => {
    const config = { limit: 5, windowMs: 10_000 }
    for (let i = 0; i < 5; i++) await rateLimit('bid:user-A', config)
    expect((await rateLimit('bid:user-A', config)).allowed).toBe(false)
    expect((await rateLimit('bid:user-B', config)).allowed).toBe(true)
  })

  it('a user can bid again after the window resets', async () => {
    vi.useFakeTimers()
    const config = { limit: 5, windowMs: 10_000 }
    for (let i = 0; i < 5; i++) await rateLimit('bid:user-1', config)
    expect((await rateLimit('bid:user-1', config)).allowed).toBe(false)
    vi.advanceTimersByTime(10_001)
    expect((await rateLimit('bid:user-1', config)).allowed).toBe(true)
  })
})
