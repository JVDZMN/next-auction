import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'

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
      bids: { orderBy: { amount: 'desc' }, take: 1 },
    },
  })

  const results = []

  for (const car of endedCars) {
    const highestBid = car.bids[0] ?? null

    let newStatus: 'completed' | 'cancelled' | 'reserve_not_met'

    if (!highestBid) {
      // No bids at all → cancelled
      newStatus = 'cancelled'
    } else if (car.reservePrice && highestBid.amount < car.reservePrice) {
      // Bids exist but reserve not reached
      newStatus = 'reserve_not_met'
    } else {
      // Bids exist and reserve met (or no reserve set)
      newStatus = 'completed'
    }

    await prisma.car.update({
      where: { id: car.id },
      data: {
        status: newStatus,
        ...(newStatus === 'completed' ? { winnerBidId: highestBid!.id } : {}),
      },
    })

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

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await updateAuctionStatuses()
    return NextResponse.json({
      processed: results.length,
      results,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    return serverError('Failed to update auction statuses', error)
  }
}
