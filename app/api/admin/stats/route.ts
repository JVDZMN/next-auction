import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    })

    if (!user || user.role !== Role.Admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 })
    }

    // Fetch all statistics
    const [
      totalUsers,
      adminUsers,
      sellers,
      bidders,
      totalCars,
      activeCars,
      totalBids,
      recentUsers,
      recentCars,
      topBidders,
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),
      
      // Admin users
      prisma.user.findMany({
        where: { role: Role.Admin },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      
      // Users who have listed cars
      prisma.user.findMany({
        where: {
          cars: {
            some: {},
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          rating: true,
          _count: {
            select: { cars: true },
          },
        },
        orderBy: {
          cars: {
            _count: 'desc',
          },
        },
        take: 20,
      }),
      
      // Users who have placed bids
      prisma.user.findMany({
        where: {
          bids: {
            some: {},
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          rating: true,
          _count: {
            select: { bids: true },
          },
        },
        orderBy: {
          bids: {
            _count: 'desc',
          },
        },
        take: 20,
      }),
      
      // Total cars
      prisma.car.count(),
      
      // Active cars
      prisma.car.count({
        where: { status: 'active' },
      }),
      
      // Total bids
      prisma.bid.count(),
      
      // Recent users
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      
      // Recent cars
      prisma.car.findMany({
        select: {
          id: true,
          brand: true,
          model: true,
          year: true,
          currentPrice: true,
          status: true,
          createdAt: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      
      // Top bidders by total bid amount
      prisma.bid.groupBy({
        by: ['bidderId'],
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
        take: 10,
      }),
    ])

    // Fetch bidder details
    const topBiddersWithDetails = await Promise.all(
      topBidders.map(async (bidder) => {
        const user = await prisma.user.findUnique({
          where: { id: bidder.bidderId },
          select: {
            id: true,
            name: true,
            email: true,
            rating: true,
          },
        })
        return {
          ...user,
          totalBidAmount: bidder._sum.amount,
          totalBids: bidder._count.id,
        }
      })
    )

    return NextResponse.json({
      stats: {
        totalUsers,
        totalCars,
        activeCars,
        totalBids,
        adminCount: adminUsers.length,
        sellerCount: sellers.length,
        bidderCount: bidders.length,
      },
      adminUsers,
      sellers,
      bidders,
      recentUsers,
      recentCars,
      topBidders: topBiddersWithDetails,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    )
  }
}
