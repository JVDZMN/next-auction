import { NextRequest, NextResponse } from 'next/server'
import { prisma, bidderSelect } from '@/lib/prisma'
import { serverError } from '@/lib/api'
import { requireAuth } from '@/lib/auth'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { BidError } from '@/lib/bid-error'
import { placeBid } from '@/lib/services/bid-service'
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

    const rl = await rateLimit(`bid:${userId}`, BID_RATE_LIMIT)
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

    const bid = await placeBid({ userId, carId, amount })

    return NextResponse.json(bid, { status: 201 })
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

    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = session.user.role === 'Admin'

    if (!isAdmin) {
      const car = await prisma.car.findUnique({ where: { id: carId }, select: { ownerId: true } })
      if (!car || car.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const bids = await prisma.bid.findMany({
      where: { carId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { bidder: { select: bidderSelect } },
    })

    return NextResponse.json({ bids })
  } catch (error) {
    return serverError('Failed to fetch bids', error)
  }
}
