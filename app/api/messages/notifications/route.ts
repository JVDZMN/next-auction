import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { serverError } from '@/lib/api'

// GET /api/messages/notifications
// Returns { unreadMessages, carsWithNewBids, outbidCarIds, users, unreadPerSender, totalCount }
export async function GET() {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // All queries use scalar selects only — no distinct+relation (unsupported in HTTP mode)
    const [
      unreadMessages,
      newBidNotifRows,
      outbidNotifRows,
      sentPeerRows,
      receivedPeerRows,
      unreadMsgCarRows,
    ] = await Promise.all([
      prisma.notification.count({
        where: { userId, read: false, type: 'new_message' },
      }),
      prisma.notification.findMany({
        where: { userId, read: false, type: 'new_bid' },
        select: { carId: true },
      }),
      prisma.notification.findMany({
        where: { userId, read: false, type: 'outbid' },
        select: { carId: true },
      }),
      // Users this person has sent messages to
      prisma.message.findMany({
        where: { senderId: userId },
        select: { receiverId: true },
        orderBy: { createdAt: 'desc' },
      }),
      // Users who have sent messages to this person
      prisma.message.findMany({
        where: { receiverId: userId },
        select: { senderId: true },
        orderBy: { createdAt: 'desc' },
      }),
      // carIds with unread new_message notifications (for per-sender lookup)
      prisma.notification.findMany({
        where: { userId, read: false, type: 'new_message' },
        select: { carId: true },
      }),
    ])

    // Deduplicate car IDs for bid/outbid
    const carsWithNewBids = [...new Set(
      newBidNotifRows.map(n => n.carId).filter((id): id is string => id !== null)
    )]
    const outbidCarIds = [...new Set(
      outbidNotifRows.map(n => n.carId).filter((id): id is string => id !== null)
    )]

    // Build unique peer list (sent + received), preserving most-recent order
    const seen = new Set<string>()
    const peerIds: string[] = []
    for (const { receiverId } of sentPeerRows) {
      if (receiverId !== userId && !seen.has(receiverId)) { seen.add(receiverId); peerIds.push(receiverId) }
    }
    for (const { senderId } of receivedPeerRows) {
      if (senderId !== userId && !seen.has(senderId)) { seen.add(senderId); peerIds.push(senderId) }
    }

    // Fetch user details for all peers
    const peerUsers = peerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: peerIds } },
          select: { id: true, name: true, image: true },
        })
      : []

    // Approximate per-sender unread: look up senders for unread-notification carIds
    const unreadCarIds = [...new Set(
      unreadMsgCarRows.map(n => n.carId).filter((id): id is string => id !== null)
    )]
    const unreadPerSender: Record<string, number> = {}
    if (unreadCarIds.length > 0) {
      const recentUnreadMsgs = await prisma.message.findMany({
        where: { receiverId: userId, carId: { in: unreadCarIds } },
        select: { senderId: true, carId: true },
        orderBy: { createdAt: 'desc' },
      })
      const seenCarSender = new Set<string>()
      for (const { senderId, carId } of recentUnreadMsgs) {
        const key = `${carId}:${senderId}`
        if (!seenCarSender.has(key)) {
          seenCarSender.add(key)
          unreadPerSender[senderId] = (unreadPerSender[senderId] ?? 0) + 1
        }
      }
    }

    // Return peers in the same order as peerIds (most-recent first)
    const userMap = new Map(peerUsers.map(u => [u.id, u]))
    const users = peerIds.map(id => userMap.get(id)).filter(Boolean)

    return NextResponse.json({
      unreadMessages,
      carsWithNewBids,
      outbidCarIds,
      users,
      unreadPerSender,
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
