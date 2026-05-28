import { PrismaClient } from '@prisma/client'
import { prisma, bidderSelect } from '@/lib/prisma'
import { validateBid } from '@/lib/bid-validation'
import { BidError } from '@/lib/bid-error'
import { sendBidNotification, sendOutbidNotification } from '@/lib/email'
import { emitToUser, emitToCar } from '@/lib/socket-server'
import { logger } from '@/lib/logger'

function maskName(raw: string): string {
  if (raw.includes('@')) {
    const [local, domain] = raw.split('@')
    return `${local[0]}***@${domain}`
  }
  return raw.split(' ').map(p => p.length > 1 ? `${p[0]}***` : p).join(' ')
}

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
  // Optimistic concurrency: read → validate → updateMany (price guard) → write bid
  // The updateMany where currentPrice = X acts as the lock: if another bid
  // landed first, count === 0 and we surface a 409 to the client.
  // ------------------------------------------------------------------
  const car = await client.car.findUnique({
    where: { id: carId },
    include: { owner: { select: { id: true, email: true, name: true } } },
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

  const carUpdate = await client.car.updateMany({
    where: { id: carId, currentPrice: car.currentPrice },
    data: { currentPrice: amount },
  })

  if (carUpdate.count !== 1) {
    throw new BidError('Another bid was placed just before yours. Please try again.', 409)
  }

  const bid = await client.bid.create({
    data: { carId, bidderId: userId, amount },
    include: { bidder: { select: bidderSelect } },
  })

  // Anti-sniping: extend auction if placed within the snipe window
  const now = new Date()
  const snipeWindow = car.antiSnipingMinutes * 60 * 1000
  await client.car.update({
    where: { id: carId },
    data: {
      winnerBidId: bid.id,
      ...(car.auctionEndDate.getTime() - now.getTime() < snipeWindow && {
        auctionEndDate: new Date(now.getTime() + snipeWindow),
      }),
    },
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
      const freshCar = await client.car.findUnique({ where: { id: carId } })
      if (freshCar && freshCar.currentPrice < competingProxy.maxAmount) {
        const proxyUpdate = await client.car.updateMany({
          where: { id: carId, currentPrice: freshCar.currentPrice },
          data: { currentPrice: proxyAmount },
        })
        if (proxyUpdate.count === 1) {
          const proxyBidRecord = await client.bid.create({
            data: { carId, bidderId: competingProxy.bidderId, amount: proxyAmount },
          })
          await client.car.update({
            where: { id: carId },
            data: { winnerBidId: proxyBidRecord.id },
          })
        }
      }
    } catch {
      // proxy bid failure is non-fatal
    }
  }

  const bidCount = await client.bid.count({ where: { carId } })

  // Broadcast new price to all viewers of this car page
  emitToCar(carId, 'bid-placed', {
    currentPrice: amount,
    bidId:        bid.id,
    bidCount,
    bidderId:    userId,
    bidderName:  maskName(bid.bidder.name ?? bid.bidder.email),
    timestamp:   new Date().toISOString(),
  })

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
        select: { bidderId: true },
      })
      const outbidUserIds = [...new Set(previousBids.map((b) => b.bidderId))]
      const outbidBidders = await client.user.findMany({
        where: { id: { in: outbidUserIds } },
        select: { id: true, email: true },
      })

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
        emitToUser(t.userId, 'new-notification', { type: t.type, message: t.message, carId })
      }

      await Promise.allSettled(
        outbidBidders
          .filter((b) => b.email)
          .map((b) => sendOutbidNotification({
            to: b.email!,
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
