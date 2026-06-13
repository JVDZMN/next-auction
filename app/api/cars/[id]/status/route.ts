import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'

const allowedStatuses = [
  'active',
  'completed',
  'no_bid',
  'cancelled',
  'reserve_not_met',
]

// These statuses are derived by the cron job (/api/cron/auction-status) and
// are only valid once auctionEndDate has passed. Allowing them to be set
// manually on a live auction causes homepage queries (which filter status='active')
// to exclude auctions that are genuinely still running, creating data inconsistencies.
const CRON_DERIVED_STATUSES = ['completed', 'no_bid', 'reserve_not_met']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` }, { status: 400 })
    }

    const car = await prisma.car.findUnique({ where: { id }, select: { ownerId: true, auctionEndDate: true } })
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    // Guard: cron-derived end-state statuses must not be set while the auction
    // is still live. The cron job is the sole authority for these transitions.
    if (CRON_DERIVED_STATUSES.includes(status) && car.auctionEndDate > new Date()) {
      return NextResponse.json(
        {
          error: `Cannot set status '${status}': auction end date is in the future (${car.auctionEndDate.toISOString()}). This status is assigned automatically by the cron job once the auction closes.`,
        },
        { status: 400 },
      )
    }

    // Only admin can set any status; owner can only cancel or pause their own car
    const isAdmin = session.user.role === 'ADMIN'
    const isOwner = car.ownerId === session.user.id
    if (!isAdmin && !(isOwner && (status === 'cancelled' || status === 'paused'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.car.update({
      where: { id },
      data: { status },
    })
    return NextResponse.json(updated)
  } catch (error) {
    return serverError('Failed to update car status', error)
  }
}
