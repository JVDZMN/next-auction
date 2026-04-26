import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma, bidderSelect } from '@/lib/prisma'
import { serverError } from '@/lib/api'
import { sendBidNotification, sendOutbidNotification } from '@/lib/email'
import { requireAuth } from '@/lib/auth'
import { emitToUser } from '@/lib/socket-server'
import { validateBid } from '@/lib/bid-validation'
import { BidError } from '@/lib/bid-error'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const BID_RATE_LIMIT = { limit: 5, windowMs: 10_000 } // 5 bids per 10 s per user

export async function POST(request: NextRequest) {
  let userId: string | undefined
  let carId: string | undefined
  let amount: number | undefined

  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    userId = session.user.id

    // Rate-limit check — before any DB work
    const rl = rateLimit(`bid:${userId}`, BID_RATE_LIMIT)
    if (!rl.allowed) {
      logger.bid.rateLimited({ userId })
      return NextResponse.json(
        { error: 'Too many bids. Please wait a moment before trying again.' },
        { status: 429, headers: rateLimitHeaders(rl, BID_RATE_LIMIT) },
      )
    }

    const body = await request.json()
    const { BidCreateSchema } = await import('@/lib/zod')
    const parseResult = BidCreateSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten() }, { status: 400 })
    }
    carId = parseResult.data.carId
    amount =
      typeof parseResult.data.amount === 'string'
        ? parseFloat(parseResult.data.amount)
        : parseResult.data.amount

    logger.bid.attempted({ userId, carId, amount })

    // -----------------------------------------------------------------------
    // Atomic transaction
    //
    // Everything from "read car" to "write bid + update price" runs in a
    // single Serializable transaction.  Postgres guarantees that no other
    // transaction can observe a different currentPrice between our SELECT
    // and our UPDATE — two concurrent bids for the same car cannot both win.
    //
    // Defense-in-depth: the optimistic lock (updateMany WHERE currentPrice =
    // our snapshot) gives an explicit, user-friendly 409 even if Postgres
    // serialization failure were somehow bypassed.
    // -----------------------------------------------------------------------
    const { bid: result, car } = await prisma.$transaction(
      async (tx) => {
        const car = await tx.car.findUnique({
          where: { id: carId },
          include: {
            owner: { select: { id: true, email: true, name: true } },
          },
        })

        if (!car) throw new BidError('Car not found', 404)

        const validation = validateBid({
          amount: amount!,
          currentPrice: car.currentPrice,
          status: car.status,
          auctionEndDate: new Date(car.auctionEndDate),
          ownerId: car.ownerId,
          bidderId: userId!,
          bidIncrement: car.bidIncrement,
        })

        if (!validation.valid) throw new BidError(validation.error, validation.httpStatus)

        const carUpdate = await tx.car.updateMany({
          where: { id: carId, currentPrice: car.currentPrice },
          data: { currentPrice: amount },
        })

        if (carUpdate.count !== 1) {
          throw new BidError(
            'Another bid was placed just before yours. Please try again.',
            409,
          )
        }

        const bid = await tx.bid.create({
          data: { carId: carId!, bidderId: userId!, amount: amount! },
          include: { bidder: { select: bidderSelect } },
        })

        // Anti-sniping: extend auction if bid placed within the snipe window
        const now = new Date()
        const snipeWindow = car.antiSnipingMinutes * 60 * 1000
        if (car.auctionEndDate.getTime() - now.getTime() < snipeWindow) {
          await tx.car.update({
            where: { id: carId },
            data: {
              winnerBidId: bid.id,
              auctionEndDate: new Date(now.getTime() + snipeWindow),
            },
          })
        } else {
          await tx.car.update({
            where: { id: carId },
            data: { winnerBidId: bid.id },
          })
        }

        return { bid, car }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    // Proxy bidding: if another user has an active proxy bid with max > placed amount, auto-counter
    const competingProxy = await prisma.proxyBid.findFirst({
      where: {
        carId: carId!,
        isActive: true,
        bidderId: { not: userId },
        maxAmount: { gt: amount! },
      },
      orderBy: { maxAmount: 'desc' },
      include: { bidder: { select: { id: true, email: true, name: true } } },
    })

    if (competingProxy) {
      const increment = car.bidIncrement ?? 1
      const proxyAmount = Math.min(amount! + increment, competingProxy.maxAmount)
      try {
        await prisma.$transaction(async (tx) => {
          const freshCar = await tx.car.findUnique({ where: { id: carId! } })
          if (!freshCar || freshCar.currentPrice >= competingProxy.maxAmount) return

          const carUpdate = await tx.car.updateMany({
            where: { id: carId!, currentPrice: freshCar.currentPrice },
            data: { currentPrice: proxyAmount },
          })
          if (carUpdate.count !== 1) return

          const proxyBidRecord = await tx.bid.create({
            data: { carId: carId!, bidderId: competingProxy.bidderId, amount: proxyAmount },
          })
          await tx.car.update({
            where: { id: carId! },
            data: { winnerBidId: proxyBidRecord.id },
          })
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
      } catch {
        // proxy bid failure is non-fatal
      }
    }

    logger.bid.placed({ userId, carId: car.id, amount })

    // -----------------------------------------------------------------------
    // Post-transaction side-effects (emails, notifications, sockets)
    // These run only after the transaction has committed successfully.
    // -----------------------------------------------------------------------

    if (car.owner?.email && car.owner.id !== userId) {
      await sendBidNotification({
        to: car.owner.email,
        carTitle: `${car.brand} ${car.model}`,
        bidAmount: amount,
        carId: car.id,
      })
    }

    const previousBids = await prisma.bid.findMany({
      where: { carId, bidderId: { not: userId } },
      distinct: ['bidderId'],
      select: { bidderId: true, bidder: { select: { email: true } } },
    })
    const outbidUserIds = previousBids.map((b) => b.bidderId)
    const carTitle = `${car.brand} ${car.model}`

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

    await prisma.notification.createMany({
      data: targets.map((t) => ({ userId: t.userId, type: t.type, message: t.message, carId: carId! })),
    })

    for (const t of targets) {
      emitToUser(t.userId, 'newNotification', { type: t.type, message: t.message, carId })
    }

    await Promise.allSettled(
      previousBids
        .filter((b) => b.bidder.email)
        .map((b) =>
          sendOutbidNotification({
            to: b.bidder.email!,
            carTitle,
            newBidAmount: amount!,
            carId: carId!,
          }),
        ),
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof BidError) {
      logger.bid.rejected({
        userId: userId ?? 'unknown',
        carId: carId ?? 'unknown',
        amount: amount ?? 0,
        reason: error.message,
        httpStatus: error.httpStatus,
      })
      return NextResponse.json({ error: error.message }, { status: error.httpStatus })
    }
    logger.bid.failed(error, { userId, carId, amount })
    return serverError('Failed to place bid', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const carId = searchParams.get('carId')

    if (!carId) {
      return NextResponse.json({ error: 'carId is required' }, { status: 400 })
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
