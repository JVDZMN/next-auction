import { NextRequest, NextResponse } from 'next/server'
import { prisma, ownerSelect, bidderSelect } from '@/lib/prisma'
import { serverError } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        owner: { select: ownerSelect },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { bidder: { select: bidderSelect } },
        },
      },
    })

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    return NextResponse.json(car)
  } catch (error) {
    return serverError('Failed to fetch car', error)
  }
}
