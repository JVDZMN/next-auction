import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'
import { sendAuctionWonEmail, sendAuctionClosedSellerEmail } from '@/lib/email'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
          include: { bidder: { select: { email: true, name: true } } },
        },
        owner: { select: { id: true, email: true, name: true } },
      },
    })

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }
    if (car.owner.id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (car.status !== 'reserve_not_met') {
      return NextResponse.json({ error: 'Can only accept bid on reserve_not_met auctions' }, { status: 400 })
    }

    const highestBid = car.bids[0]
    if (!highestBid) {
      return NextResponse.json({ error: 'No bids to accept' }, { status: 400 })
    }

    await prisma.car.update({
      where: { id },
      data: { status: 'completed', winnerBidId: highestBid.id },
    })

    const carTitle = `${car.year} ${car.brand} ${car.model}`

    void sendAuctionWonEmail({
      to: highestBid.bidder.email!,
      winnerName: highestBid.bidder.name ?? 'Bidder',
      carTitle,
      finalPrice: highestBid.amount,
      carId: id,
    })
    void sendAuctionClosedSellerEmail({
      to: car.owner.email!,
      sellerName: car.owner.name ?? 'Seller',
      carTitle,
      carId: id,
      outcome: 'completed',
      finalPrice: highestBid.amount,
      winnerName: highestBid.bidder.name ?? 'Bidder',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError('Failed to accept bid', error)
  }
}
