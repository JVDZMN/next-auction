import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { auctionEndDate } = body
    if (!auctionEndDate) return NextResponse.json({ error: 'auctionEndDate required' }, { status: 400 })
    if (new Date(auctionEndDate) <= new Date()) return NextResponse.json({ error: 'End date must be in the future' }, { status: 400 })

    const car = await prisma.car.findUnique({ where: { id } })
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    if (car.ownerId !== session.user.id && session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!['cancelled', 'reserve_not_met'].includes(car.status)) {
      return NextResponse.json({ error: 'Only cancelled or reserve_not_met auctions can be relisted' }, { status: 400 })
    }

    const updated = await prisma.car.update({
      where: { id },
      data: {
        status: 'active',
        auctionEndDate: new Date(auctionEndDate),
        currentPrice: car.startingPrice,
        winnerBidId: null,
        views: 0,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return serverError('Failed to relist car', error)
  }
}
