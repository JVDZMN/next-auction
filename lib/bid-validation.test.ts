import { describe, it, expect, beforeEach } from 'vitest'
import { validateBid, type BidValidationInput } from './bid-validation'
import { BidCreateSchema } from './zod'

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
