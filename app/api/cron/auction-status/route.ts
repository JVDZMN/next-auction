import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'
import {
  sendAuctionWonEmail,
  sendAuctionClosedSellerEmail,
  sendEmail,
} from '@/lib/email'
import { emitToCar } from '@/lib/socket-server'
import { Redis } from '@upstash/redis'

const LOCK_KEY = 'cron:auction-status'
const LOCK_TTL = 250

async function acquireCronLock(): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return true
  const redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  const result = await redis.set(LOCK_KEY, '1', { nx: true, ex: LOCK_TTL })
  return result === 'OK'
}

async function releaseCronLock() {
  if (!process.env.UPSTASH_REDIS_REST_URL) return
  const redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  await redis.del(LOCK_KEY)
}

// ── Close ended active auctions ───────────────────────────────────────────────
export async function updateAuctionStatuses() {
  const now = new Date()
  console.log('[cron] updateAuctionStatuses running — UTC now:', now.toISOString())

  const endedCars = await prisma.car.findMany({
    where: { status: 'active', auctionEndDate: { lte: now } },
    include: {
      bids: {
        orderBy: { amount: 'desc' },
        take: 1,
        include: { bidder: { select: { id: true, email: true, name: true } } },
      },
      owner: { select: { email: true, name: true } },
    },
  })

  console.log('[cron] Found', endedCars.length, 'ended auctions to process')

  const results = []

  for (const car of endedCars) {
    console.log('[cron] Processing car:', car.id, '| endDate:', car.auctionEndDate.toISOString(), '| bids:', car.bids.length)
    const highestBid = car.bids[0] ?? null
    const carTitle   = `${car.year} ${car.brand} ${car.model}`

    if (!highestBid) {
      await prisma.car.update({ where: { id: car.id }, data: { status: 'no_bid' } })
      await emitToCar(car.id, 'auction-ended', { status: 'no_bid', finalPrice: null })
      void sendAuctionClosedSellerEmail({
        to: car.owner.email!, sellerName: car.owner.name ?? 'Seller',
        carTitle, carId: car.id, outcome: 'no_bid',
      })
      results.push({ id: car.id, status: 'no_bid', highestBid: null, reservePrice: car.reservePrice ?? null, winnerId: null })
      continue
    }

    if (car.reservePrice && highestBid.amount < car.reservePrice) {
      await prisma.car.update({ where: { id: car.id }, data: { status: 'reserve_not_met' } })
      await emitToCar(car.id, 'auction-ended', { status: 'reserve_not_met', finalPrice: highestBid.amount })
      void sendAuctionClosedSellerEmail({
        to: car.owner.email!, sellerName: car.owner.name ?? 'Seller',
        carTitle, carId: car.id, outcome: 'reserve_not_met', finalPrice: highestBid.amount,
      })
      results.push({ id: car.id, status: 'reserve_not_met', highestBid: highestBid.amount, reservePrice: car.reservePrice ?? null, winnerId: null })
      continue
    }

    // Winner — set completed immediately, no payment step
    await prisma.car.update({
      where: { id: car.id },
      data:  { status: 'completed', winnerBidId: highestBid.id },
    })
    await emitToCar(car.id, 'auction-ended', { status: 'completed', finalPrice: highestBid.amount })

    void sendAuctionWonEmail({
      to:         highestBid.bidder.email!,
      winnerName: highestBid.bidder.name ?? 'Bidder',
      carTitle,
      finalPrice: highestBid.amount,
      carId:      car.id,
      sellerEmail: car.owner.email!,
    })
    void sendAuctionClosedSellerEmail({
      to:          car.owner.email!,
      sellerName:  car.owner.name ?? 'Seller',
      carTitle,
      carId:       car.id,
      outcome:     'completed',
      finalPrice:  highestBid.amount,
      winnerName:  highestBid.bidder.name ?? 'Bidder',
      winnerEmail: highestBid.bidder.email!,
    })

    results.push({ id: car.id, status: 'completed', highestBid: highestBid.amount, reservePrice: car.reservePrice ?? null, winnerId: highestBid.bidder.id })
  }

  return results
}

// ── Near-close notifications ──────────────────────────────────────────────────
async function notifyNearClose() {
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const in23h = new Date(Date.now() + 23 * 60 * 60 * 1000)

  const closingSoon = await prisma.car.findMany({
    where: { status: 'active', isDraft: false, auctionEndDate: { gte: in23h, lte: in24h } },
    include: {
      likedBy: {
        where: { notifyNearClose: true },
        include: { user: { select: { email: true, name: true } } },
      },
    },
  })

  for (const car of closingSoon) {
    const carTitle = `${car.year} ${car.brand} ${car.model}`
    for (const like of car.likedBy) {
      void sendEmail({
        to:      like.user.email,
        subject: `Closing soon: ${carTitle}`,
        html: `
          <h2>Auction closing in less than 24 hours</h2>
          <p>Hi ${like.user.name ?? 'there'},</p>
          <p><strong>${carTitle}</strong> is ending soon. Current price: <strong>${car.currentPrice.toLocaleString('da-DK')} kr</strong>.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/cars/${car.id}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
            View Auction
          </a>
        `,
      })
    }
  }
}

// ── GET handler ───────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const locked = await acquireCronLock().catch(() => true)
  if (!locked) {
    return NextResponse.json({ skipped: true, reason: 'Another instance is running' })
  }

  try {
    const [results] = await Promise.all([
      updateAuctionStatuses(),
      notifyNearClose(),
    ])
    return NextResponse.json({
      processed:  results.length,
      results,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    return serverError('Failed to update auction statuses', error)
  } finally {
    await releaseCronLock().catch(() => {})
  }
}
