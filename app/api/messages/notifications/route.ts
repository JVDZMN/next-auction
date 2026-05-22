import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { serverError } from '@/lib/api'

// GET /api/messages/notifications
// Returns { unreadMessages, carsWithNewBids, outbidCarIds, users, totalCount }
export async function GET() {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [unreadMessages, newBidNotifs, outbidNotifs, senderUsers] = await Promise.all([
      prisma.notification.count({
        where: { userId: session.user.id, read: false, type: 'new_message' },
      }),
      // Distinct carIds where this user (as owner) has unread new_bid notifications
      prisma.notification.findMany({
        where: { userId: session.user.id, read: false, type: 'new_bid' },
        distinct: ['carId'],
        select: { carId: true },
      }),
      // Distinct carIds where this user (as bidder) has been outbid
      prisma.notification.findMany({
        where: { userId: session.user.id, read: false, type: 'outbid' },
        distinct: ['carId'],
        select: { carId: true },
      }),
      prisma.message.findMany({
        where: { receiverId: session.user.id },
        distinct: ['senderId'],
        orderBy: { createdAt: 'desc' },
        select: { sender: { select: { id: true, name: true, image: true } } },
      }),
    ])

    const carsWithNewBids = newBidNotifs
      .map((n: (typeof newBidNotifs)[number]) => n.carId)
      .filter((id): id is string => id !== null)

    const outbidCarIds = outbidNotifs
      .map((n: (typeof outbidNotifs)[number]) => n.carId)
      .filter((id): id is string => id !== null)

    return NextResponse.json({
      unreadMessages,
      carsWithNewBids,
      outbidCarIds,
      users: senderUsers.map(m => m.sender),
      totalCount: unreadMessages + carsWithNewBids.length + outbidCarIds.length,
    })
  } catch (error) {
    return serverError('Failed to fetch notifications', error)
  }
}

// PATCH /api/messages/notifications
// Body: { scope: 'messages' | 'bids' | 'outbid', carId?: string }
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({})) as { scope?: string; carId?: string }
    const { scope, carId } = body

    if (scope === 'messages') {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false, type: 'new_message' },
        data: { read: true },
      })
    } else if (scope === 'bids' && carId) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false, type: 'new_bid', carId },
        data: { read: true },
      })
    } else if (scope === 'outbid' && carId) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false, type: 'outbid', carId },
        data: { read: true },
      })
    } else {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError('Failed to mark notifications as read', error)
  }
}
