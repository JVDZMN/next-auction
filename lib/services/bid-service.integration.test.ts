/**
 * Integration tests for bid-service — requires a live PostgreSQL database.
 *
 * Set TEST_DATABASE_URL before running:
 *   TEST_DATABASE_URL=postgresql://... npm run test:integration
 *
 * What these tests prove:
 *   - The Serializable transaction + optimistic lock prevents duplicate wins
 *   - Under concurrent load, the final DB state is always consistent
 *   - Prisma P2034 (serialization failure) surfaces as a retryable BidError(409)
 *   - No phantom rows, no corrupted currentPrice, no duplicate winning bids
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { db, ensureMigrated, resetDb, disconnectDb, seedUser, seedCar } from '@/lib/test/db'
import { placeBid } from './bid-service'
import { BidError } from '@/lib/bid-error'

beforeAll(ensureMigrated)
beforeEach(resetDb)
afterAll(disconnectDb)

// ---------------------------------------------------------------------------
// Helper: run N concurrent placeBid calls and collect settled results
// ---------------------------------------------------------------------------
async function concurrentBids(params: Array<{ userId: string; carId: string; amount: number }>) {
  return Promise.allSettled(params.map(p => placeBid({ ...p, _db: db, _disableSideEffects: true })))
}

// ---------------------------------------------------------------------------
// 1. Basic concurrent bid — two users, same price point
// ---------------------------------------------------------------------------

describe('concurrent bids — same price', () => {
  it('exactly one bid commits when two users bid the same amount simultaneously', async () => {
    const owner = await seedUser({ email: 'owner@test.com' })
    const bidderA = await seedUser({ email: 'a@test.com' })
    const bidderB = await seedUser({ email: 'b@test.com' })
    const car = await seedCar(owner.id, { currentPrice: 100_000 })

    const results = await concurrentBids([
      { userId: bidderA.id, carId: car.id, amount: 105_000 },
      { userId: bidderB.id, carId: car.id, amount: 105_000 },
    ])

    const fulfilled = results.filter(r => r.status === 'fulfilled')
    const rejected  = results.filter(r => r.status === 'rejected')

    // Exactly one succeeds
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)

    // The rejected one is a retryable 409, not a 500
    const err = (rejected[0] as PromiseRejectedResult).reason
    expect(err).toBeInstanceOf(BidError)
    expect(err.httpStatus).toBe(409)

    // DB state: currentPrice updated exactly once
    const updated = await db.car.findUniqueOrThrow({ where: { id: car.id } })
    expect(updated.currentPrice).toBe(105_000)

    // Only one bid row committed
    const bids = await db.bid.findMany({ where: { carId: car.id } })
    expect(bids).toHaveLength(1)
    expect(bids[0].amount).toBe(105_000)
  })
})

// ---------------------------------------------------------------------------
// 2. Sequential valid bids — each at a strictly higher amount
// ---------------------------------------------------------------------------

describe('sequential valid bids', () => {
  it('all N bids commit when each is strictly higher than the previous', async () => {
    const owner   = await seedUser({ email: 'owner2@test.com' })
    const bidders = await Promise.all(
      Array.from({ length: 5 }, (_, i) => seedUser({ email: `bidder${i}@test.com` }))
    )
    const car = await seedCar(owner.id, { currentPrice: 100_000 })

    // Fire bids one after another with strictly increasing amounts
    // (concurrent would mean only one wins — this proves sequential ordering)
    for (let i = 0; i < bidders.length; i++) {
      await placeBid({
        userId: bidders[i].id,
        carId: car.id,
        amount: 100_000 + (i + 1) * 5_000,
        _db: db, _disableSideEffects: true,
      })
    }

    const finalCar = await db.car.findUniqueOrThrow({ where: { id: car.id } })
    expect(finalCar.currentPrice).toBe(125_000)

    const bids = await db.bid.findMany({ where: { carId: car.id }, orderBy: { createdAt: 'asc' } })
    expect(bids).toHaveLength(5)
    expect(bids[bids.length - 1].amount).toBe(125_000)
  })
})

// ---------------------------------------------------------------------------
// 3. High-concurrency storm — 20 parallel bids, all same amount
//    (100 would require a larger connection pool; 20 is representative)
// ---------------------------------------------------------------------------

describe('high-concurrency storm', () => {
  it('exactly one bid commits out of 20 simultaneous bids at the same price', async () => {
    const owner = await seedUser({ email: 'owner3@test.com' })
    const bidders = await Promise.all(
      Array.from({ length: 20 }, (_, i) => seedUser({ email: `storm${i}@test.com` }))
    )
    const car = await seedCar(owner.id, { currentPrice: 100_000 })

    const results = await concurrentBids(
      bidders.map(b => ({ userId: b.id, carId: car.id, amount: 110_000 }))
    )

    const fulfilled = results.filter(r => r.status === 'fulfilled')
    const rejected  = results.filter(r => r.status === 'rejected')

    // The invariant: exactly one writer wins, the rest get 409
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(19)

    // All rejected are BidErrors — not server crashes (no 500s)
    // Some get 409 (concurrent lock conflict); others get 400 (arrived after
    // the price moved, so their amount is no longer strictly higher — correct behaviour)
    for (const r of rejected) {
      const err = (r as PromiseRejectedResult).reason
      expect(err).toBeInstanceOf(BidError)
      expect([400, 409]).toContain(err.httpStatus)
    }

    // DB integrity: one bid row, correct price, no duplicates
    const finalCar = await db.car.findUniqueOrThrow({ where: { id: car.id } })
    expect(finalCar.currentPrice).toBe(110_000)

    const bids = await db.bid.findMany({ where: { carId: car.id } })
    expect(bids).toHaveLength(1)
    expect(bids[0].amount).toBe(110_000)
  })

  it('winnerBidId on the car matches the single committed bid', async () => {
    const owner   = await seedUser({ email: 'owner4@test.com' })
    const bidders = await Promise.all(
      Array.from({ length: 10 }, (_, i) => seedUser({ email: `wb${i}@test.com` }))
    )
    const car = await seedCar(owner.id, { currentPrice: 100_000 })

    await concurrentBids(
      bidders.map(b => ({ userId: b.id, carId: car.id, amount: 115_000 }))
    )

    const finalCar = await db.car.findUniqueOrThrow({ where: { id: car.id } })
    const bids     = await db.bid.findMany({ where: { carId: car.id } })

    expect(bids).toHaveLength(1)
    // The car's winnerBidId must point to the one committed bid
    expect(finalCar.winnerBidId).toBe(bids[0].id)
  })
})

// ---------------------------------------------------------------------------
// 4. Rejection correctness — invalid bids do not corrupt state
// ---------------------------------------------------------------------------

describe('rejection scenarios', () => {
  it('rejects a bid below currentPrice with 400, leaves DB unchanged', async () => {
    const owner  = await seedUser({ email: 'ow5@test.com' })
    const bidder = await seedUser({ email: 'bd5@test.com' })
    const car    = await seedCar(owner.id, { currentPrice: 100_000 })

    const err = await placeBid({ userId: bidder.id, carId: car.id, amount: 90_000, _db: db, _disableSideEffects: true })
      .then(() => null).catch(e => e)

    expect(err).toBeInstanceOf(BidError)
    expect(err.httpStatus).toBe(400)

    // currentPrice untouched
    const after = await db.car.findUniqueOrThrow({ where: { id: car.id } })
    expect(after.currentPrice).toBe(100_000)
    expect(await db.bid.count({ where: { carId: car.id } })).toBe(0)
  })

  it('rejects a bid on an expired auction with 400', async () => {
    const owner  = await seedUser({ email: 'ow6@test.com' })
    const bidder = await seedUser({ email: 'bd6@test.com' })
    const car    = await seedCar(owner.id, {
      currentPrice: 100_000,
      auctionEndDate: new Date(Date.now() - 60_000), // ended 1 min ago
    })

    const err = await placeBid({ userId: bidder.id, carId: car.id, amount: 110_000, _db: db, _disableSideEffects: true })
      .then(() => null).catch(e => e)

    expect(err).toBeInstanceOf(BidError)
    expect(err.httpStatus).toBe(400)
    expect(await db.bid.count({ where: { carId: car.id } })).toBe(0)
  })

  it('rejects the owner bidding on their own listing with 403', async () => {
    const owner = await seedUser({ email: 'ow7@test.com' })
    const car   = await seedCar(owner.id, { currentPrice: 100_000 })

    const err = await placeBid({ userId: owner.id, carId: car.id, amount: 110_000, _db: db, _disableSideEffects: true })
      .then(() => null).catch(e => e)

    expect(err).toBeInstanceOf(BidError)
    expect(err.httpStatus).toBe(403)
  })

  it('rejects a bid on a non-existent car with 404', async () => {
    const bidder = await seedUser({ email: 'bd8@test.com' })

    const err = await placeBid({ userId: bidder.id, carId: 'does-not-exist', amount: 110_000, _db: db, _disableSideEffects: true })
      .then(() => null).catch(e => e)

    expect(err).toBeInstanceOf(BidError)
    expect(err.httpStatus).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// 5. Anti-sniping — bid in the final window extends the auction
// ---------------------------------------------------------------------------

describe('anti-sniping', () => {
  it('extends auctionEndDate when a bid lands within the snipe window', async () => {
    const owner  = await seedUser({ email: 'ow9@test.com' })
    const bidder = await seedUser({ email: 'bd9@test.com' })

    // Auction ends in 90 seconds — inside the default 2-minute snipe window
    const endsAt = new Date(Date.now() + 90_000)
    const car    = await seedCar(owner.id, { currentPrice: 100_000, auctionEndDate: endsAt })

    await placeBid({ userId: bidder.id, carId: car.id, amount: 110_000, _db: db, _disableSideEffects: true })

    const after = await db.car.findUniqueOrThrow({ where: { id: car.id } })
    // End date should have been pushed forward (> original endsAt)
    expect(after.auctionEndDate.getTime()).toBeGreaterThan(endsAt.getTime())
  })

  it('does not extend auctionEndDate for bids outside the snipe window', async () => {
    const owner  = await seedUser({ email: 'ow10@test.com' })
    const bidder = await seedUser({ email: 'bd10@test.com' })

    // Auction ends in 1 hour — outside the 2-minute snipe window
    const endsAt = new Date(Date.now() + 3_600_000)
    const car    = await seedCar(owner.id, { currentPrice: 100_000, auctionEndDate: endsAt })

    await placeBid({ userId: bidder.id, carId: car.id, amount: 110_000, _db: db, _disableSideEffects: true })

    const after = await db.car.findUniqueOrThrow({ where: { id: car.id } })
    expect(after.auctionEndDate.getTime()).toBeCloseTo(endsAt.getTime(), -3)
  })
})
