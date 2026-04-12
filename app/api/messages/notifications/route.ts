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

    const [unreadMessages, senderUsers] = await Promise.all([
      // Count unread message notifications
      prisma.notification.count({
        where: {
          userId: session.user.id,
          type: 'new_message',
          read: false,
        },
      }),
      // Get distinct senders who have messaged this user
      prisma.message.findMany({
        where: { receiverId: session.user.id },
        distinct: ['senderId'],
        orderBy: { createdAt: 'desc' },
        select: {
          sender: {
            select: { id: true, name: true, image: true },
          },
        },
      }),
    ])

    return NextResponse.json({
      unreadCount: unreadMessages,
      users: senderUsers.map((m) => m.sender),
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
