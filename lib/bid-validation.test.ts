import { describe, it, expect } from 'vitest'
import { validateBid, type BidValidationInput } from './bid-validation'
import { BidCreateSchema } from './zod'
import { BidError } from '@/lib/bid-error'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FUTURE = new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 h from now
const PAST = new Date(Date.now() - 1000 * 60 * 60 * 24)   // 24 h ago

function makeInput(overrides: Partial<BidValidationInput> = {}): BidValidationInput {
  return {
    amount: 15_000,
    currentPrice: 10_000,
    status: 'active',
    auctionEndDate: FUTURE,
    ownerId: 'owner-1',
    bidderId: 'bidder-1',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// validateBid — business rule tests
// ---------------------------------------------------------------------------

describe('validateBid', () => {
  it('accepts a valid bid', () => {
    const result = validateBid(makeInput())
    expect(result.valid).toBe(true)
  })

  describe('auction status', () => {
    it('rejects when status is not active', () => {
      const result = validateBid(makeInput({ status: 'closed' }))
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('Auction is not active')
        expect(result.httpStatus).toBe(400)
      }
    })

    it('rejects when status is pending', () => {
      const result = validateBid(makeInput({ status: 'pending' }))
      expect(result.valid).toBe(false)
    })
  })

  describe('auction end date', () => {
    it('rejects when auction has already ended', () => {
      const result = validateBid(makeInput({ auctionEndDate: PAST }))
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('Auction has ended')
        expect(result.httpStatus).toBe(400)
      }
    })

    it('accepts when auction end date is in the future', () => {
      const result = validateBid(makeInput({ auctionEndDate: FUTURE }))
      expect(result.valid).toBe(true)
    })
  })

  describe('bid amount vs current price', () => {
    it('rejects when bid equals current price', () => {
      const result = validateBid(makeInput({ amount: 10_000, currentPrice: 10_000 }))
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('Bid must be higher than current price')
        expect(result.error).toContain('10000')
        expect(result.httpStatus).toBe(400)
      }
    })

    it('rejects when bid is lower than current price', () => {
      const result = validateBid(makeInput({ amount: 5_000, currentPrice: 10_000 }))
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('Bid must be higher than current price')
      }
    })

    it('accepts when bid is exactly 1 unit above current price', () => {
      const result = validateBid(makeInput({ amount: 10_001, currentPrice: 10_000 }))
      expect(result.valid).toBe(true)
    })
  })

  describe('owner bidding on own car', () => {
    it('rejects when bidder is the owner', () => {
      const result = validateBid(makeInput({ ownerId: 'user-1', bidderId: 'user-1' }))
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('You cannot bid on your own car')
        expect(result.httpStatus).toBe(400)
      }
    })

    it('accepts when bidder is different from owner', () => {
      const result = validateBid(makeInput({ ownerId: 'owner-1', bidderId: 'bidder-1' }))
      expect(result.valid).toBe(true)
    })
  })

  describe('rule priority', () => {
    it('reports inactive auction before checking amount', () => {
      // Both "inactive" and "low amount" errors could fire — inactive wins
      const result = validateBid(makeInput({ status: 'closed', amount: 1 }))
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('Auction is not active')
      }
    })

    it('reports ended auction before checking amount', () => {
      const result = validateBid(makeInput({ auctionEndDate: PAST, amount: 1 }))
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('Auction has ended')
      }
    })
  })
})

// ---------------------------------------------------------------------------
// BidCreateSchema — Zod validation tests
// ---------------------------------------------------------------------------

describe('BidCreateSchema', () => {
  it('accepts a valid numeric amount', () => {
    const result = BidCreateSchema.safeParse({ carId: 'car-123', amount: 5000 })
    expect(result.success).toBe(true)
  })

  it('accepts a valid string amount', () => {
    const result = BidCreateSchema.safeParse({ carId: 'car-123', amount: '5000' })
    expect(result.success).toBe(true)
  })

  it('rejects when carId is missing', () => {
    const result = BidCreateSchema.safeParse({ amount: 5000 })
    expect(result.success).toBe(false)
  })

  it('rejects when carId is empty string', () => {
    const result = BidCreateSchema.safeParse({ carId: '', amount: 5000 })
    expect(result.success).toBe(false)
  })

  it('rejects when amount is zero', () => {
    const result = BidCreateSchema.safeParse({ carId: 'car-123', amount: 0 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.amount).toBeDefined()
    }
  })

  it('rejects when amount is negative', () => {
    const result = BidCreateSchema.safeParse({ carId: 'car-123', amount: -100 })
    expect(result.success).toBe(false)
  })

  it('rejects when amount is a non-numeric string', () => {
    const result = BidCreateSchema.safeParse({ carId: 'car-123', amount: 'abc' })
    expect(result.success).toBe(false)
  })

  it('rejects when amount is missing', () => {
    const result = BidCreateSchema.safeParse({ carId: 'car-123' })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// BidError — typed error used inside the Prisma transaction
// ---------------------------------------------------------------------------

describe('BidError', () => {
  it('carries the message and httpStatus', () => {
    const err = new BidError('Auction has ended', 400)
    expect(err.message).toBe('Auction has ended')
    expect(err.httpStatus).toBe(400)
    expect(err.name).toBe('BidError')
  })

  it('is an instance of Error', () => {
    expect(new BidError('x', 400)).toBeInstanceOf(Error)
  })

  it('is distinguishable from a generic Error', () => {
    const generic = new Error('generic')
    const bid = new BidError('bid', 409)
    expect(bid).toBeInstanceOf(BidError)
    expect(generic).not.toBeInstanceOf(BidError)
  })
})

// ---------------------------------------------------------------------------
// Race-condition scenario
//
// The DB-level protection (Serializable isolation + optimistic lock) cannot
// be unit tested without a real database.  These tests document the scenario
// in pure logic: two requests that both pass validateBid() with the same
// snapshot, demonstrating why the DB guard is necessary.
// ---------------------------------------------------------------------------

describe('race condition — why DB-level protection is needed', () => {
  const SNAPSHOT_PRICE = 10_000

  it('two concurrent bids both pass validateBid() with the same price snapshot', () => {
    // Both users read currentPrice = 10_000 before either commits.
    const resultA = validateBid(makeInput({ amount: 15_000, currentPrice: SNAPSHOT_PRICE }))
    const resultB = validateBid(makeInput({ amount: 12_000, currentPrice: SNAPSHOT_PRICE, bidderId: 'bidder-2' }))

    // Both pass — this is the race window the transaction must close.
    expect(resultA.valid).toBe(true)
    expect(resultB.valid).toBe(true)
  })

  it('only the first committer wins when the optimistic lock is simulated', () => {
    // Simulate what happens inside the transaction after User A commits first:
    // the DB price is now 15_000.  User B re-validates against that price.
    const resultB_afterCommit = validateBid(
      makeInput({ amount: 12_000, currentPrice: 15_000, bidderId: 'bidder-2' }),
    )

    // User B's bid (12_000) is now below the committed price (15_000) — rejected.
    expect(resultB_afterCommit.valid).toBe(false)
    if (!resultB_afterCommit.valid) {
      expect(resultB_afterCommit.error).toContain('Bid must be higher than current price')
    }
  })

  it('a BidError with 409 is thrown when the optimistic lock detects a lost race', () => {
    // Simulate the route throwing BidError when updateMany returns count = 0.
    const throwWhenLost = (count: number) => {
      if (count !== 1) throw new BidError('Another bid was placed just before yours. Please try again.', 409)
    }

    expect(() => throwWhenLost(0)).toThrowError(BidError)
    expect(() => throwWhenLost(0)).toThrow('Another bid was placed just before yours')
    expect(() => throwWhenLost(1)).not.toThrow()
  })
})
