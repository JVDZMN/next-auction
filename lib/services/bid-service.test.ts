/**
 * Concurrent bid tests — service layer.
 *
 * These tests exercise the optimistic-lock path in placeBid() using
 * deterministic mocks of the Prisma methods. Two bids arrive for the same car
 * with the same currentPrice snapshot; our guard (updateMany WHERE
 * currentPrice = snapshot) ensures exactly one wins and the second receives
 * a 409 BidError.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Hoist mock functions so they are available inside vi.mock factories
// ---------------------------------------------------------------------------

const {
  mockCarFindUnique,
  mockCarUpdateMany,
  mockCarUpdate,
  mockBidCreate,
  mockBidCount,
  mockProxyBidFindFirst,
  mockBidFindMany,
  mockUserFindUnique,
  mockUserFindMany,
  mockNotificationCreateMany,
} = vi.hoisted(() => ({
  mockCarFindUnique:        vi.fn(),
  mockCarUpdateMany:        vi.fn(),
  mockCarUpdate:            vi.fn(),
  mockBidCreate:            vi.fn(),
  mockBidCount:             vi.fn(),
  mockProxyBidFindFirst:    vi.fn(),
  mockBidFindMany:          vi.fn(),
  mockUserFindUnique:       vi.fn(),
  mockUserFindMany:         vi.fn(),
  mockNotificationCreateMany: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/email', () => ({
  sendBidNotification:  vi.fn().mockResolvedValue(undefined),
  sendOutbidNotification: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/socket-server', () => ({ emitToUser: vi.fn(), emitToCar: vi.fn() }))
vi.mock('@/lib/logger', () => ({
  logger: {
    bid: { placed: vi.fn(), rateLimited: vi.fn(), attempted: vi.fn(), rejected: vi.fn(), failed: vi.fn() },
    error: vi.fn(),
  },
}))
vi.mock('@/lib/prisma', () => {
  const tx = {
    car:          { findUnique: mockCarFindUnique, updateMany: mockCarUpdateMany, update: mockCarUpdate },
    bid:          { create: mockBidCreate, findMany: mockBidFindMany, count: mockBidCount },
    proxyBid:     { findFirst: mockProxyBidFindFirst },
    user:         { findUnique: mockUserFindUnique, findMany: mockUserFindMany },
    notification: { createMany: mockNotificationCreateMany },
  }
  return {
    bidderSelect: { id: true, name: true, email: true },
    prisma: {
      ...tx,
      $transaction: vi.fn().mockImplementation((cb: (arg: unknown) => unknown) => cb(tx)),
    },
  }
})

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
    owner: { id: 'owner-1', email: 'owner@example.com', name: 'Owner', role: 'PRIVATE_USER' as const },
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

beforeEach(() => {
  vi.clearAllMocks()
  mockProxyBidFindFirst.mockResolvedValue(null)
  mockBidFindMany.mockResolvedValue([])
  mockBidCount.mockResolvedValue(1)
  mockUserFindUnique.mockResolvedValue({ role: 'PRIVATE_USER', isApprovedByAdmin: true })
  mockUserFindMany.mockResolvedValue([])
  mockNotificationCreateMany.mockResolvedValue({})
  mockCarUpdate.mockImplementation(async ({ data }: { data: unknown }) => data)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('placeBid — optimistic lock', () => {
  it('succeeds when the optimistic lock passes (updateMany count = 1)', async () => {
    const car = makeCar(10_000)
    const bid = makeBid('bid-1', 12_000)

    mockCarFindUnique.mockResolvedValue(car)
    mockCarUpdateMany.mockResolvedValue({ count: 1 })
    mockBidCreate.mockResolvedValue(bid)

    const result = await placeBid({
      userId: 'bidder-1', carId: 'car-1', amount: 12_000, _disableSideEffects: true,
    })
    expect(result.id).toBe('bid-1')
    expect(result.amount).toBe(12_000)
  })

  it('throws BidError(409) when the optimistic lock fails', async () => {
    const car = makeCar(10_000)

    mockCarFindUnique.mockResolvedValue(car)
    mockCarUpdateMany.mockResolvedValue({ count: 0 })

    const error = await placeBid({
      userId: 'bidder-1', carId: 'car-1', amount: 12_000, _disableSideEffects: true,
    }).then(() => null).catch(e => e)

    expect(error).toBeDefined()
    expect(error.httpStatus).toBe(409)
    expect(error.message).toMatch(/another bid/i)
  })

  it('simulates two concurrent bids — exactly one succeeds, one gets 409', async () => {
    const car = makeCar(10_000)
    const bidA = makeBid('bid-A', 12_000)

    mockCarFindUnique.mockResolvedValue(car)
    // First updateMany succeeds, second fails (simulates the optimistic lock)
    mockCarUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
    mockBidCreate.mockResolvedValue(bidA)

    const results = await Promise.allSettled([
      placeBid({ userId: 'bidder-A', carId: 'car-1', amount: 12_000, _disableSideEffects: true }),
      placeBid({ userId: 'bidder-B', carId: 'car-1', amount: 12_000, _disableSideEffects: true }),
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
    mockCarFindUnique.mockResolvedValue(null)

    const error = await placeBid({
      userId: 'bidder-1', carId: 'ghost', amount: 5_000, _disableSideEffects: true,
    }).then(() => null).catch(e => e)

    expect(error).toBeDefined()
    expect(error.httpStatus).toBe(404)
  })

  it('does not place a bid if the auction has ended', async () => {
    const expiredCar = { ...makeCar(), auctionEndDate: new Date(Date.now() - 1000) }
    mockCarFindUnique.mockResolvedValue(expiredCar)

    const error = await placeBid({
      userId: 'bidder-1', carId: 'car-1', amount: 12_000, _disableSideEffects: true,
    }).then(() => null).catch(e => e)

    expect(error).toBeDefined()
    expect(error.httpStatus).toBe(400)
  })
})
