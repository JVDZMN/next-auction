import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'

export async function GET() {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id

    const [myCars, myBids, activeProxies] = await Promise.all([
      prisma.car.findMany({
        where: { ownerId: userId },
        select: {
          id: true, brand: true, model: true, year: true,
          status: true, currentPrice: true, reservePrice: true,
          createdAt: true,
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bid.findMany({
        where: { bidderId: userId },
        select: {
          id: true, amount: true,
          car: {
            select: {
              id: true, status: true, currentPrice: true, winnerBidId: true,
            },
          },
        },
      }),
      prisma.proxyBid.count({ where: { bidderId: userId, isActive: true } }),
    ])

    // Listing performance for seller/business view
    const listingPerformance = myCars.map(car => ({
      label: `${car.year} ${car.brand} ${car.model}`.slice(0, 22),
      bids: car._count.bids,
      currentPrice: car.currentPrice,
      reservePrice: car.reservePrice ?? 0,
      status: car.status,
    }))

    const sold = myCars.filter(c => c.status === 'completed')
    const sellThroughRate = myCars.length > 0
      ? Math.round((sold.length / myCars.length) * 100)
      : 0
    const avgBidsPerListing = myCars.length > 0
      ? Math.round(myCars.reduce((s, c) => s + c._count.bids, 0) / myCars.length)
      : 0
    const totalRevenue = sold.reduce((s, c) => s + c.currentPrice, 0)

    // Bid status breakdown — one entry per car (highest bid wins)
    const bidsByCar: Record<string, typeof myBids[0]> = {}
    for (const bid of myBids) {
      const existing = bidsByCar[bid.car.id]
      if (!existing || bid.amount > existing.amount) bidsByCar[bid.car.id] = bid
    }

    let winning = 0, won = 0, outbid = 0, ended = 0
    for (const bid of Object.values(bidsByCar)) {
      if (bid.car.status === 'active') {
        if (bid.car.winnerBidId === bid.id) winning++
        else outbid++
      } else if (bid.car.status === 'completed') {
        if (bid.car.winnerBidId === bid.id) won++
        else ended++
      } else {
        ended++
      }
    }

    const bidBreakdown = [
      { status: 'Winning', count: winning, fill: '#22c55e' },
      { status: 'Won',     count: won,     fill: '#3b82f6' },
      { status: 'Outbid',  count: outbid,  fill: '#ef4444' },
      { status: 'Ended',   count: ended,   fill: '#94a3b8' },
    ].filter(s => s.count > 0)

    const totalBidCount = Object.keys(bidsByCar).length
    const winRate = totalBidCount > 0 ? Math.round((won / totalBidCount) * 100) : 0

    return NextResponse.json({
      listingPerformance,
      sellThroughRate,
      avgBidsPerListing,
      totalRevenue,
      totalListings: myCars.length,
      soldListings: sold.length,
      winRate,
      totalBidCount,
      wonBids: won,
      activeProxies,
      bidBreakdown,
    })
  } catch (error) {
    return serverError('Failed to fetch analytics', error)
  }
}
