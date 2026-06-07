'use server'

import { requireAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { BidCreateSchema, ProxyBidSchema } from '@/lib/zod'
import { placeBid as placeBidService } from '@/lib/services/bid-service'
import { prisma } from '@/lib/prisma'
import { BidError } from '@/lib/bid-error'
import { logger } from '@/lib/logger'

const BID_RATE_LIMIT = { limit: 5, windowMs: 10_000 }

type BidResult   = { error: string } | { id: string }
type ProxyResult = { error: string } | { id: string }

export async function placeBid(carId: string, amount: number): Promise<BidResult> {
  const session = await requireAuth()
  if (!session) return { error: 'Unauthorized' }

  const rl = await rateLimit(`bid:${session.user.id}`, BID_RATE_LIMIT)
  if (!rl.allowed) return { error: 'Too many bids. Please wait a moment before trying again.' }

  const parse = BidCreateSchema.safeParse({ carId, amount })
  if (!parse.success) return { error: 'Invalid input' }

  const parsedAmount =
    typeof parse.data.amount === 'string' ? parseFloat(parse.data.amount) : parse.data.amount

  logger.bid.attempted({ userId: session.user.id, carId, amount: parsedAmount })

  try {
    const bid = await placeBidService({ userId: session.user.id, carId, amount: parsedAmount })
    return { id: bid.id }
  } catch (err) {
    if (err instanceof BidError) {
      logger.bid.rejected({
        userId: session.user.id, carId, amount: parsedAmount,
        reason: err.message, httpStatus: err.httpStatus,
      })
      return { error: err.message }
    }
    logger.bid.failed(err, { userId: session.user.id, carId, amount: parsedAmount })
    return { error: 'Failed to place bid' }
  }
}

export async function setProxyBid(carId: string, maxAmount: number): Promise<ProxyResult> {
  const session = await requireAuth()
  if (!session) return { error: 'Unauthorized' }

  const parse = ProxyBidSchema.safeParse({ carId, maxAmount })
  if (!parse.success) return { error: 'Invalid input' }

  const car = await prisma.car.findUnique({ where: { id: carId } })
  if (!car)                            return { error: 'Car not found' }
  if (car.status !== 'active')         return { error: 'Auction is not active' }
  if (car.ownerId === session.user.id) return { error: 'Cannot proxy bid on your own car' }
  if (parse.data.maxAmount <= car.currentPrice)
    return { error: `Max amount must be greater than current price ${car.currentPrice.toLocaleString('da-DK')} kr` }

  const proxy = await prisma.proxyBid.upsert({
    where:  { carId_bidderId: { carId, bidderId: session.user.id } },
    create: { carId, bidderId: session.user.id, maxAmount: parse.data.maxAmount },
    update: { maxAmount: parse.data.maxAmount, isActive: true },
  })

  // Skip immediate bid if this user is already winning
  const topBid = await prisma.bid.findFirst({
    where: { carId },
    orderBy: { amount: 'desc' },
    select: { bidderId: true },
  })
  if (topBid?.bidderId === session.user.id) return { id: proxy.id }

  // Resolve all active proxies: winner bids one increment above second-highest max
  const allProxies = await prisma.proxyBid.findMany({
    where: { carId, isActive: true },
    orderBy: { maxAmount: 'desc' },
    take: 2,
  })
  if (allProxies.length === 0) return { id: proxy.id }

  const increment = car.bidIncrement ?? 1
  const winner = allProxies[0]
  const initialBid = allProxies.length >= 2
    ? Math.min(allProxies[1].maxAmount + increment, winner.maxAmount)
    : car.currentPrice + increment

  if (initialBid <= car.currentPrice || initialBid > winner.maxAmount) return { id: proxy.id }

  try {
    await placeBidService({ userId: winner.bidderId, carId, amount: initialBid })
  } catch (err) {
    if (err instanceof BidError && err.httpStatus !== 409) return { error: err.message }
    // 409 = lost race to a concurrent bid; proxy is saved and will counter on next bid
  }

  return { id: proxy.id }
}
