import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 })
    }

    const { id } = await params

    // Fetch car with all bids and bidder information
    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          include: {
            bidder: {
              select: {
                id: true,
                name: true,
                email: true,
                _count: {
                  select: {
                    bids: true,
                    cars: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    // Calculate bid statistics
    const bidStats = {
      totalBids: car.bids.length,
      uniqueBidders: new Set(car.bids.map(b => b.bidderId)).size,
      highestBid: car.bids.length > 0 ? Math.max(...car.bids.map(b => b.amount)) : null,
      lowestBid: car.bids.length > 0 ? Math.min(...car.bids.map(b => b.amount)) : null,
      averageBid: car.bids.length > 0 
        ? car.bids.reduce((sum, b) => sum + b.amount, 0) / car.bids.length 
        : null,
    }

    return NextResponse.json({
      car,
      bidStats,
    })
  } catch (error) {
    return serverError('Failed to fetch car details', error)
  }
}
