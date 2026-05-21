import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'
import { prisma, bidderSelect } from '@/lib/prisma'
import { validateBid } from '@/lib/bid-validation'
import { BidError } from '@/lib/bid-error'
import { sendBidNotification, sendOutbidNotification } from '@/lib/email'
import { emitToUser } from '@/lib/socket-server'
import { logger } from '@/lib/logger'

export interface PlaceBidInput {
  userId: string
  carId: string
  amount: number
  // Allows integration tests to inject a test-database client without mocking
  _db?: PrismaClient
  // Skip fire-and-forget side effects (emails, notifications) in integration tests
  _disableSideEffects?: boolean
}

export async function placeBid({ userId, carId, amount, _db, _disableSideEffects }: PlaceBidInput) {
  const client = _db ?? prisma
  // ------------------------------------------------------------------
  // Atomic transaction: read car, validate, optimistic-lock update, write bid
  // Serializable isolation prevents two concurrent bids both winning.
  // ------------------------------------------------------------------
  // P2034 = Postgres serialization failure — surface as a retryable 409
  const { bid, car } = await client.$transaction(
    async (tx) => {
      const car = await tx.car.findUnique({
        where: { id: carId },
        include: {
          owner: { select: { id: true, email: true, name: true } },
        },
      })

      if (!car) throw new BidError('Car not found', 404)

      const validation = validateBid({
        amount,
        currentPrice: car.currentPrice,
        status: car.status,
        auctionEndDate: new Date(car.auctionEndDate),
        ownerId: car.ownerId,
        bidderId: userId,
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
        data: { carId, bidderId: userId, amount },
        include: { bidder: { select: bidderSelect } },
      })

      // Anti-sniping: extend auction if placed within the snipe window
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
  ).catch((err) => {
    if (err instanceof PrismaClientKnownRequestError && err.code === 'P2034') {
      throw new BidError('Another bid was placed just before yours. Please try again.', 409)
    }
    throw err
  })

  // ------------------------------------------------------------------
  // Proxy bidding: auto-counter if a competing proxy bid exists
  // ------------------------------------------------------------------
  const competingProxy = await client.proxyBid.findFirst({
    where: {
      carId,
      isActive: true,
      bidderId: { not: userId },
      maxAmount: { gt: amount },
    },
    orderBy: { maxAmount: 'desc' },
  })

  if (competingProxy) {
    const increment = car.bidIncrement ?? 1
    const proxyAmount = Math.min(amount + increment, competingProxy.maxAmount)
    try {
      await client.$transaction(async (tx) => {
        const freshCar = await tx.car.findUnique({ where: { id: carId } })
        if (!freshCar || freshCar.currentPrice >= competingProxy.maxAmount) return

        const carUpdate = await tx.car.updateMany({
          where: { id: carId, currentPrice: freshCar.currentPrice },
          data: { currentPrice: proxyAmount },
        })
        if (carUpdate.count !== 1) return

        const proxyBidRecord = await tx.bid.create({
          data: { carId, bidderId: competingProxy.bidderId, amount: proxyAmount },
        })
        await tx.car.update({
          where: { id: carId },
          data: { winnerBidId: proxyBidRecord.id },
        })
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch {
      // proxy bid failure is non-fatal
    }
  }

  logger.bid.placed({ userId, carId: car.id, amount })

  // ------------------------------------------------------------------
  // Post-bid side-effects: emails, notifications, socket events
  // Fire-and-forget — the bid response is returned without waiting.
  // ------------------------------------------------------------------
  if (_disableSideEffects) return bid
  void (async () => {
    try {
      const carTitle = `${car.brand} ${car.model}`

      if (car.owner?.email && car.owner.id !== userId) {
        void sendBidNotification({
          to: car.owner.email,
          carTitle,
          bidAmount: amount,
          carId: car.id,
        })
      }

      const previousBids = await client.bid.findMany({
        where: { carId, bidderId: { not: userId } },
        distinct: ['bidderId'],
        select: { bidderId: true, bidder: { select: { email: true } } },
      })
      const outbidUserIds = previousBids.map((b) => b.bidderId)

      type NotifTarget = { userId: string; type: string; message: string }
      const targets: NotifTarget[] = [
        { userId: car.ownerId, type: 'new_bid', message: `New bid of ${amount} on your ${carTitle}` },
        ...outbidUserIds.map((bidderId) => ({
          userId: bidderId,
          type: 'outbid',
          message: `You have been outbid on ${carTitle}. New highest bid: ${amount}`,
        })),
      ]

      await client.notification.createMany({
        data: targets.map((t) => ({ userId: t.userId, type: t.type, message: t.message, carId })),
      })

      for (const t of targets) {
        emitToUser(t.userId, 'newNotification', { type: t.type, message: t.message, carId })
      }

      await Promise.allSettled(
        previousBids
          .filter((b) => b.bidder.email)
          .map((b) => sendOutbidNotification({
            to: b.bidder.email!,
            carTitle,
            newBidAmount: amount,
            carId,
          })),
      )
    } catch (err) {
      logger.error('Post-bid side-effects failed', err, { carId, userId })
    }
  })()

  return bid
}
