import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { carId, amount } = await request.json()

    if (!carId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid bid data' },
        { status: 400 }
      )
    }

    // Get the car with current bids
    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: {
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    // Check if auction is still active
    if (car.status !== 'active') {
      return NextResponse.json(
        { error: 'Auction is not active' },
        { status: 400 }
      )
    }

    // Check if auction has ended
    if (new Date(car.auctionEndDate) < new Date()) {
      return NextResponse.json(
        { error: 'Auction has ended' },
        { status: 400 }
      )
    }

    // Check if bid is higher than current price
    if (amount <= car.currentPrice) {
      return NextResponse.json(
        { error: `Bid must be higher than current price: $${car.currentPrice}` },
        { status: 400 }
      )
    }

    // Check if user is not the owner
    if (car.ownerId === user.id) {
      return NextResponse.json(
        { error: 'You cannot bid on your own car' },
        { status: 400 }
      )
    }

    // Create the bid and update car price in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const bid = await tx.bid.create({
        data: {
          carId,
          bidderId: user.id,
          amount,
        },
        include: {
          bidder: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      await tx.car.update({
        where: { id: carId },
        data: {
          currentPrice: amount,
          winnerBidId: bid.id,
        },
      })

      return bid
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating bid:', error)
    return NextResponse.json(
      { error: 'Failed to place bid' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const carId = searchParams.get('carId')

    if (!carId) {
      return NextResponse.json(
        { error: 'carId is required' },
        { status: 400 }
      )
    }

    const bids = await prisma.bid.findMany({
      where: { carId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        bidder: {
          select: {
            id: true,
            name: true,
            email: true,
            rating: true,
          },
        },
      },
    })

    return NextResponse.json(bids)
  } catch (error) {
    console.error('Error fetching bids:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    )
  }
}
