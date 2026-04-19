import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const car = await prisma.car.findUnique({ where: { id } })
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    if (car.ownerId !== session.user.id && session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: _id, createdAt: _c, updatedAt: _u, winnerBidId: _w, views: _v, ...rest } = car

    const duplicate = await prisma.car.create({
      data: {
        ...rest,
        isDraft: true,
        status: 'active',
        currentPrice: car.startingPrice,
        auctionEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json(duplicate, { status: 201 })
  } catch (error) {
    return serverError('Failed to duplicate car', error)
  }
}
