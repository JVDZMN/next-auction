/**
 * Concurrent bid tests — service layer.
 *
 * These tests exercise the optimistic-lock path in placeBid() using a
 * deterministic mock of the Prisma transaction.  Two bids arrive for the
 * same car with the same currentPrice snapshot; our guard (updateMany WHERE
 * currentPrice = snapshot) ensures exactly one wins and the second receives
 * a 409 BidError.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BidError } from '@/lib/bid-error'

// ---------------------------------------------------------------------------
// Hoist mock functions so they are available inside vi.mock factories
// ---------------------------------------------------------------------------

const {
  mockTransaction,
  mockProxyBidFindFirst,
  mockBidFindMany,
  mockNotificationCreateMany,
} = vi.hoisted(() => ({
  mockTransaction: vi.fn(),
  mockProxyBidFindFirst: vi.fn(),
  mockBidFindMany: vi.fn(),
  mockNotificationCreateMany: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/email', () => ({
  sendBidNotification: vi.fn().mockResolvedValue(undefined),
  sendOutbidNotification: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/socket-server', () => ({ emitToUser: vi.fn() }))
vi.mock('@/lib/logger', () => ({
  logger: {
    bid: { placed: vi.fn(), rateLimited: vi.fn(), attempted: vi.fn(), rejected: vi.fn(), failed: vi.fn() },
    error: vi.fn(),
  },
}))
vi.mock('@/lib/prisma', () => ({
  bidderSelect: { id: true, name: true, email: true },
  prisma: {
    $transaction: mockTransaction,
    proxyBid: { findFirst: mockProxyBidFindFirst },
    bid: { findMany: mockBidFindMany },
    notification: { createMany: mockNotificationCreateMany },
  },
}))

// Import the service AFTER mocks are in place
import { placeBid } from './bid-service'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FUTURE = new Date(Date.now() + 86_400_000)

function makeCar(currentPrice = 10_000) {
  return {
    id: 'car-1',
    ownerId: 'owner-1',
    brand: 'BMW',
    model: 'M3',
    status: 'active' as const,
    currentPrice,
    auctionEndDate: FUTURE,
    antiSnipingMinutes: 2,
    bidIncrement: null,
    owner: { id: 'owner-1', email: 'owner@example.com', name: 'Owner' },
  }
}

function makeBid(id: string, amount: number) {
  return {
    id,
    carId: 'car-1',
    bidderId: 'bidder-1',
    amount,
    createdAt: new Date(),
    bidder: { id: 'bidder-1', name: 'Bidder', email: 'bidder@example.com' },
  }
}

function makeTx(car: ReturnType<typeof makeCar>, updateCount: number, bid: ReturnType<typeof makeBid>) {
  return {
    car: {
      findUnique: vi.fn().mockResolvedValue(car),
      updateMany: vi.fn().mockResolvedValue({ count: updateCount }),
      update: vi.fn().mockResolvedValue(car),
    },
    bid: { create: vi.fn().mockResolvedValue(bid) },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockProxyBidFindFirst.mockResolvedValue(null)
  mockBidFindMany.mockResolvedValue([])
  mockNotificationCreateMany.mockResolvedValue({})
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('placeBid — optimistic lock', () => {
  it('succeeds when the optimistic lock passes (updateMany count = 1)', async () => {
    const car = makeCar(10_000)
    const bid = makeBid('bid-1', 12_000)

    mockTransaction.mockImplementation(async (fn: Function) => {
      return fn(makeTx(car, 1, bid))
    })

    const result = await placeBid({ userId: 'bidder-1', carId: 'car-1', amount: 12_000 })
    expect(result.id).toBe('bid-1')
    expect(result.amount).toBe(12_000)
  })

  it('throws BidError(409) when the optimistic lock fails', async () => {
    const car = makeCar(10_000)
    const bid = makeBid('bid-x', 12_000)

    mockTransaction.mockImplementation(async (fn: Function) => {
      return fn(makeTx(car, 0, bid))
    })

    const error = await placeBid({ userId: 'bidder-1', carId: 'car-1', amount: 12_000 })
      .then(() => null)
      .catch(e => e)

    expect(error).toBeDefined()
    expect(error.httpStatus).toBe(409)
    expect(error.message).toMatch(/another bid/i)
  })

  it('simulates two concurrent bids — exactly one succeeds, one gets 409', async () => {
    const car = makeCar(10_000)
    const bidA = makeBid('bid-A', 12_000)
    const bidB = makeBid('bid-B', 12_000)
    let callCount = 0

    mockTransaction.mockImplementation(async (fn: Function) => {
      const isFirst = callCount++ === 0
      const bid = isFirst ? bidA : bidB
      return fn(makeTx(car, isFirst ? 1 : 0, bid))
    })

    const results = await Promise.allSettled([
      placeBid({ userId: 'bidder-A', carId: 'car-1', amount: 12_000 }),
      placeBid({ userId: 'bidder-B', carId: 'car-1', amount: 12_000 }),
    ])

    const fulfilled = results.filter(r => r.status === 'fulfilled')
    const rejected  = results.filter(r => r.status === 'rejected')

    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)

    const err = (rejected[0] as PromiseRejectedResult).reason
    expect(err.httpStatus).toBe(409)
    expect(err.message).toMatch(/another bid/i)
  })

  it('does not place a bid if the car is not found', async () => {
    mockTransaction.mockImplementation(async (fn: Function) => {
      const tx = {
        car: { findUnique: vi.fn().mockResolvedValue(null) },
        bid: { create: vi.fn() },
      }
      return fn(tx)
    })

    const error = await placeBid({ userId: 'bidder-1', carId: 'ghost', amount: 5_000 })
      .then(() => null)
      .catch(e => e)

    expect(error).toBeDefined()
    expect(error.httpStatus).toBe(404)
  })

  it('does not place a bid if the auction has ended', async () => {
    const expiredCar = { ...makeCar(), auctionEndDate: new Date(Date.now() - 1000) }

    mockTransaction.mockImplementation(async (fn: Function) => {
      const tx = {
        car: { findUnique: vi.fn().mockResolvedValue(expiredCar), updateMany: vi.fn(), update: vi.fn() },
        bid: { create: vi.fn() },
      }
      return fn(tx)
    })

    const error = await placeBid({ userId: 'bidder-1', carId: 'car-1', amount: 12_000 })
      .then(() => null)
      .catch(e => e)

    expect(error).toBeDefined()
    expect(error.httpStatus).toBe(400)
  })
})
