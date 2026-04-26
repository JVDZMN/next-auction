import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'
import { sendAuctionWonEmail, sendAuctionClosedSellerEmail, sendEmail } from '@/lib/email'

/**
 * Status rules (runs on ended auctions):
 *
 *  active           → auction is still running (auctionEndDate in the future)
 *  completed        → auction ended, at least one bid, highest bid >= reservePrice (or no reserve set)
 *  reserve_not_met  → auction ended, bids exist but highest bid < reservePrice
 *  cancelled        → auction ended with zero bids
 */
export async function updateAuctionStatuses() {
  const endedCars = await prisma.car.findMany({
    where: {
      status: 'active',
      auctionEndDate: { lte: new Date() },
    },
    include: {
      bids: {
        orderBy: { amount: 'desc' },
        take: 1,
        include: { bidder: { select: { email: true, name: true } } },
      },
      owner: { select: { email: true, name: true } },
    },
  })

  const results = []

  for (const car of endedCars) {
    const highestBid = car.bids[0] ?? null

    let newStatus: 'completed' | 'cancelled' | 'reserve_not_met'

    if (!highestBid) {
      newStatus = 'cancelled'
    } else if (car.reservePrice && highestBid.amount < car.reservePrice) {
      newStatus = 'reserve_not_met'
    } else {
      newStatus = 'completed'
    }

    const carTitle = `${car.year} ${car.brand} ${car.model}`

    await prisma.car.update({
      where: { id: car.id },
      data: {
        status: newStatus,
        ...(newStatus === 'completed' ? { winnerBidId: highestBid!.id } : {}),
      },
    })

    if (newStatus === 'completed' && highestBid) {
      void sendAuctionWonEmail({
        to: highestBid.bidder.email!,
        winnerName: highestBid.bidder.name ?? 'Bidder',
        carTitle,
        finalPrice: highestBid.amount,
        carId: car.id,
      })
      void sendAuctionClosedSellerEmail({
        to: car.owner.email!,
        sellerName: car.owner.name ?? 'Seller',
        carTitle,
        carId: car.id,
        outcome: 'completed',
        finalPrice: highestBid.amount,
        winnerName: highestBid.bidder.name ?? 'Bidder',
      })
    } else if (newStatus === 'reserve_not_met' && highestBid) {
      void sendAuctionClosedSellerEmail({
        to: car.owner.email!,
        sellerName: car.owner.name ?? 'Seller',
        carTitle,
        carId: car.id,
        outcome: 'reserve_not_met',
        finalPrice: highestBid.amount,
      })
    } else if (newStatus === 'cancelled') {
      void sendAuctionClosedSellerEmail({
        to: car.owner.email!,
        sellerName: car.owner.name ?? 'Seller',
        carTitle,
        carId: car.id,
        outcome: 'cancelled',
      })
    }

    results.push({
      id: car.id,
      status: newStatus,
      highestBid: highestBid?.amount ?? null,
      reservePrice: car.reservePrice ?? null,
      winnerId: newStatus === 'completed' ? (highestBid?.bidderId ?? null) : null,
    })
  }

  return results
}

async function notifyNearClose() {
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const in23h = new Date(Date.now() + 23 * 60 * 60 * 1000)

  const closingSoon = await prisma.car.findMany({
    where: {
      status: 'active',
      isDraft: false,
      auctionEndDate: { gte: in23h, lte: in24h },
    },
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
        to: like.user.email,
        subject: `Closing soon: ${carTitle}`,
        html: `
          <h2>Auction closing in less than 24 hours</h2>
          <p>Hi ${like.user.name ?? 'there'},</p>
          <p><strong>${carTitle}</strong> is ending soon. Current price: <strong>$${car.currentPrice.toLocaleString()}</strong>.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/cars/${car.id}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
            View Auction
          </a>
        `,
      })
    }
  }
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [results] = await Promise.all([
      updateAuctionStatuses(),
      notifyNearClose(),
    ])
    return NextResponse.json({
      processed: results.length,
      results,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    return serverError('Failed to update auction statuses', error)
  }
}
