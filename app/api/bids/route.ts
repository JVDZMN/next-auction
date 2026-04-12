import { NextRequest, NextResponse } from 'next/server'
import { prisma, bidderSelect } from '@/lib/prisma'
import { serverError } from '@/lib/api'
import { sendBidNotification, sendOutbidNotification } from '@/lib/email'
import { requireAuth } from '@/lib/auth'
import { emitToUser } from '@/lib/socket-server'
import { validateBid } from '@/lib/bid-validation'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = { id: session.user.id }


    const body = await request.json();
    const { BidCreateSchema } = await import('@/lib/zod');
    const parseResult = BidCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten() }, { status: 400 });
    }
    const { carId } = parseResult.data;
    let { amount } = parseResult.data;
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

    const validation = validateBid({
      amount,
      currentPrice: car.currentPrice,
      status: car.status,
      auctionEndDate: new Date(car.auctionEndDate),
      ownerId: car.ownerId,
      bidderId: user.id,
    })

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: validation.httpStatus })
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
        include: { bidder: { select: bidderSelect } },
      });

      // Set winnerBidId after bid is created
      await tx.car.update({
        where: { id: carId },
        data: { winnerBidId: bid.id },
      });

      return bid;
    });

    // Send email notification to car owner
    if (car.owner && car.owner.email && car.owner.id !== user.id) {
      await sendBidNotification({
        to: car.owner.email,
        carTitle: `${car.brand} ${car.model}`,
        bidAmount: amount,
        carId: car.id,
      });
    }

    // Find all previous bidders on this car (excluding the current bidder) with their emails
    const previousBids = await prisma.bid.findMany({
      where: { carId, bidderId: { not: user.id } },
      distinct: ['bidderId'],
      select: { bidderId: true, bidder: { select: { email: true } } },
    })
    const outbidUserIds = previousBids.map((b) => b.bidderId)

    const carTitle = `${car.brand} ${car.model}`

    // Notification targets: owner (new bid) + all previous bidders (outbid)
    type NotifTarget = { userId: string; type: string; message: string }
    const targets: NotifTarget[] = [
      {
        userId: car.ownerId,
        type: 'new_bid',
        message: `New bid of ${amount} on your ${carTitle}`,
      },
      ...outbidUserIds.map((bidderId) => ({
        userId: bidderId,
        type: 'outbid',
        message: `You have been outbid on ${carTitle}. New highest bid: ${amount}`,
      })),
    ]

    // Persist to DB
    await prisma.notification.createMany({
      data: targets.map((t) => ({ userId: t.userId, type: t.type, message: t.message, carId })),
    })

    // Emit real-time socket events
    for (const t of targets) {
      emitToUser(t.userId, 'newNotification', { type: t.type, message: t.message, carId })
    }

    // Send outbid emails to previous bidders
    await Promise.allSettled(
      previousBids
        .filter((b) => b.bidder.email)
        .map((b) =>
          sendOutbidNotification({
            to: b.bidder.email!,
            carTitle,
            newBidAmount: amount,
            carId,
          })
        )
    )

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return serverError('Failed to place bid', error)
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
      include: { bidder: { select: bidderSelect } },
    })

    return NextResponse.json(bids)
  } catch (error) {
    return serverError('Failed to fetch bids', error)
  }
}
