import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        cars: {
          orderBy: { createdAt: 'desc' },
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
    console.error('Error fetching user dashboard:', error)
    return NextResponse.json({ error: 'Failed to fetch user dashboard' }, { status: 500 })
  }
}
