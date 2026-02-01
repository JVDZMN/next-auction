import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { sendBidNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }


    const body = await request.json();
    const { BidCreateSchema } = await import('@/lib/zod');
    const parseResult = BidCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten() }, { status: 400 });
    }
    let { carId, amount } = parseResult.data;
    amount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Get the car with current bids and owner
    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: {
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        owner: {
          select: { id: true, email: true, name: true },
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
      );
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
      // Atomically update car only if currentPrice matches (prevents race)
      const carUpdate = await tx.car.updateMany({
        where: {
          id: carId,
          currentPrice: car.currentPrice, // must match what we just read
        },
        data: {
          currentPrice: amount,
        },
      });

      if (carUpdate.count !== 1) {
        throw new Error('Bid rejected: another bid was placed just before yours. Please try again.');
      }

      const bid = await tx.bid.create({
        data: {
          carId,
          bidderId: user.id,
          amount: amount,
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
      });

      // Set winnerBidId after bid is created
      await tx.car.update({
        where: { id: carId },
        data: { winnerBidId: bid.id },
      });

      return bid;
    });

    // Send email notification to car owner (idempotent: only if owner is not the bidder)
    if (car.owner && car.owner.email && car.owner.id !== user.id) {
      await sendBidNotification({
      to: car.owner.email,
      carTitle: `${car.brand} ${car.model}`,
      bidAmount: amount,
      carId: car.id,
      });
    }

    return NextResponse.json(result, { status: 201 });
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
