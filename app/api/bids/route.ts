import { NextRequest, NextResponse } from 'next/server'
import { prisma, bidderSelect } from '@/lib/prisma'
import { serverError } from '@/lib/api'
import { requireAuth } from '@/lib/auth'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { BidError } from '@/lib/bid-error'
import { placeBid } from '@/lib/services/bid-service'
import { logger } from '@/lib/logger'
import { Redis } from '@upstash/redis'

const BID_RATE_LIMIT = { limit: 5, windowMs: 10_000 } // 5 bids per 10 s per user

async function checkIdempotency(key: string): Promise<'new' | 'duplicate'> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return 'new'
  const redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  const result = await redis.set(`idemp:${key}`, '1', { nx: true, ex: 600 })
  return result === 'OK' ? 'new' : 'duplicate'
}

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

    const idempKey = request.headers.get('idempotency-key')
    if (idempKey) {
      const status = await checkIdempotency(`${userId}:${idempKey}`)
      if (status === 'duplicate') {
        return NextResponse.json({ error: 'Duplicate request' }, { status: 409 })
      }
    }

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

function maskName(raw: string): string {
  if (raw.includes('@')) {
    const [local, domain] = raw.split('@')
    return `${local[0]}***@${domain}`
  }
  return raw.split(' ').map(p => p.length > 1 ? `${p[0]}***` : p).join(' ')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const carId = searchParams.get('carId')

    if (!carId) {
      return NextResponse.json({ error: 'carId is required' }, { status: 400 })
    }

    const session = await requireAuth().catch(() => null)
    const car = await prisma.car.findUnique({ where: { id: carId }, select: { ownerId: true } })
    const isPrivileged = session && (session.user.role === 'ADMIN' || session.user.id === car?.ownerId)

    const bids = await prisma.bid.findMany({
      where: { carId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { bidder: { select: bidderSelect } },
    })

    const result = isPrivileged
      ? bids
      : bids.map(b => ({
          ...b,
          bidder: { ...b.bidder, name: maskName(b.bidder.name ?? b.bidder.email), email: '' },
        }))

    return NextResponse.json({ bids: result })
  } catch (error) {
    return serverError('Failed to fetch bids', error)
  }
}
