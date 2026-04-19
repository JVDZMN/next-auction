import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        cars: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            status: true,
            isDraft: true,
            currentPrice: true,
            startingPrice: true,
            auctionEndDate: true,
            views: true,
            _count: { select: { bids: true } },
          },
        },
        savedSearches: {
          orderBy: { createdAt: 'desc' },
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          include: {
            car: {
              select: {
                id: true,
                brand: true,
                model: true,
                year: true,
                status: true,
                currentPrice: true,
                auctionEndDate: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    return serverError('Failed to fetch user dashboard', error)
  }
}
