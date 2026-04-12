import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { serverError } from '@/lib/api'

// GET /api/messages/notifications
// Returns unread message count and list of users who sent unread messages
export async function GET() {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [unreadCount, senderUsers, bidNotifications] = await Promise.all([
      // Count ALL unread notifications (messages + bids)
      prisma.notification.count({
        where: { userId: session.user.id, read: false },
      }),
      // Distinct senders who have messaged this user
      prisma.message.findMany({
        where: { receiverId: session.user.id },
        distinct: ['senderId'],
        orderBy: { createdAt: 'desc' },
        select: {
          sender: { select: { id: true, name: true, image: true } },
        },
      }),
      // Recent unread bid notifications
      prisma.notification.findMany({
        where: {
          userId: session.user.id,
          type: { in: ['new_bid', 'outbid'] },
          read: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, message: true, type: true, carId: true, createdAt: true },
      }),
    ])

    return NextResponse.json({
      unreadCount,
      users: senderUsers.map((m) => m.sender),
      bidNotifications,
    })
  } catch (error) {
    return serverError('Failed to fetch notifications', error)
  }
}

// PATCH /api/messages/notifications — mark all message notifications as read
export async function PATCH() {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        type: 'new_message',
        read: false,
      },
      data: { read: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError('Failed to mark notifications as read', error)
  }
}
