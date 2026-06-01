import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { serverError } from '@/lib/api'
import { sendDisputeNotificationEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: carId } = await params
    const { reason }    = await request.json()

    if (!reason?.trim()) return NextResponse.json({ error: 'Reason is required' }, { status: 400 })

    const car = await prisma.car.findUnique({
      where:   { id: carId },
      include: { winnerBid: { include: { bidder: { select: { id: true } } } }, owner: { select: { email: true, name: true } } },
    })

    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    if (car.status !== 'completed') return NextResponse.json({ error: 'Dispute window is not open' }, { status: 400 })
    if (car.disputeDeadline && car.disputeDeadline < new Date())
      return NextResponse.json({ error: 'Dispute window has closed' }, { status: 400 })
    if (car.winnerBid?.bidder.id !== session.user.id)
      return NextResponse.json({ error: 'Only the winner can file a dispute' }, { status: 403 })

    await prisma.car.update({
      where: { id: carId },
      data:  { status: 'disputed', disputeReason: reason.trim() },
    })

    const carTitle   = `${car.year} ${car.brand} ${car.model}`
    const buyerName  = session.user.name ?? session.user.email ?? 'Buyer'
    const adminEmail = process.env.ADMIN_EMAIL

    if (adminEmail) {
      void sendDisputeNotificationEmail({ to: adminEmail, carTitle, carId, buyerName, reason, isAdmin: true })
    }
    if (car.owner.email) {
      void sendDisputeNotificationEmail({ to: car.owner.email, carTitle, carId, buyerName, reason, isAdmin: false })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError('Failed to file dispute', error)
  }
}
