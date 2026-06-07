import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'
import { Role } from '@prisma/client'

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function GET() {
  try {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const now = new Date()
    const thirtyDaysAgo  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const twelveWeeksAgo = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000)

    const [recentBids, recentUsers, allCars, pendingApprovals] = await Promise.all([
      prisma.bid.findMany({
        where:  { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.user.findMany({
        where:  { createdAt: { gte: twelveWeeksAgo } },
        select: { createdAt: true },
      }),
      prisma.car.findMany({
        where:  { isDraft: false },
        select: { status: true, brand: true },
      }),
      prisma.user.count({
        where: { role: Role.BUSINESS_USER, isApprovedByAdmin: false },
      }),
    ])

    // Daily bids — last 30 days
    const bidMap: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      bidMap[toDateKey(d)] = 0
    }
    for (const bid of recentBids) {
      const key = toDateKey(new Date(bid.createdAt))
      if (key in bidMap) bidMap[key]++
    }
    const bidsOverTime = Object.entries(bidMap).map(([date, bids]) => ({
      date: date.slice(5).replace('-', '/'),
      bids,
    }))

    // Weekly user registrations — last 12 weeks (weeks start on Monday)
    const userWeekMap: Record<string, number> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      const day = d.getDay()
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
      userWeekMap[toDateKey(d)] = 0
    }
    for (const user of recentUsers) {
      const d = new Date(user.createdAt)
      const day = d.getDay()
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
      const key = toDateKey(d)
      if (key in userWeekMap) userWeekMap[key]++
    }
    const usersOverTime = Object.entries(userWeekMap).map(([week, users]) => ({
      week: week.slice(5).replace('-', '/'),
      users,
    }))

    // Auction status distribution
    const statusMap: Record<string, number> = {}
    for (const car of allCars) {
      statusMap[car.status] = (statusMap[car.status] ?? 0) + 1
    }
    const auctionStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

    // Top 10 brands
    const brandMap: Record<string, number> = {}
    for (const car of allCars) {
      brandMap[car.brand] = (brandMap[car.brand] ?? 0) + 1
    }
    const topBrands = Object.entries(brandMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([brand, count]) => ({ brand, count }))

    return NextResponse.json({ bidsOverTime, usersOverTime, auctionStatus, topBrands, pendingApprovals })
  } catch (error) {
    return serverError('Failed to fetch chart data', error)
  }
}
