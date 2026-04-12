import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { serverError } from '@/lib/api'
import { emitToUser } from '@/lib/socket-server'
import { sendMessageNotification } from '@/lib/email'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit'

const MSG_RATE_LIMIT = { limit: 10, windowMs: 60_000 } // 10 messages per minute per user

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rl = rateLimit(`msg:${session.user.id}`, MSG_RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many messages. Please slow down.' },
        { status: 429, headers: rateLimitHeaders(rl, MSG_RATE_LIMIT) },
      )
    }

    const { carId, receiverId, replyToMessageId, content } = await request.json();
    if (!carId || !content) {
      return NextResponse.json({ error: 'Missing carId or content' }, { status: 400 });
    }
    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: { ownerId: true, brand: true, model: true },
    });
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }
    const finalReceiverId = receiverId || car.ownerId;
    const newMessage = await prisma.message.create({
      data: {
        carId,
        senderId: session.user.id,
        receiverId: finalReceiverId,
        content,
        replyToMessageId: replyToMessageId || null,
      },
      include: {
        sender: { select: { id: true, email: true, name: true } },
        receiver: { select: { id: true, email: true, name: true } },
        replyTo: true,
      },
    });
    // Create a notification for the receiver
    const notification = await prisma.notification.create({
      data: {
        userId: finalReceiverId,
        type: 'new_message',
        message: `New message from ${newMessage.sender.name || newMessage.sender.email}`,
        carId,
      },
    });

    // Push real-time notification to the receiver's socket room
    emitToUser(finalReceiverId, 'newNotification', {
      id: notification.id,
      message: notification.message,
      type: notification.type,
      carId: notification.carId,
      createdAt: notification.createdAt,
    });

    // Push the actual message content so an open chat window updates immediately
    emitToUser(finalReceiverId, 'newMessage', {
      senderId: session.user.id,
      content,
      carId,
    });

    // Send email notification to receiver (fire-and-forget)
    if (newMessage.receiver.email) {
      sendMessageNotification({
        to: newMessage.receiver.email,
        senderName: newMessage.sender.name || newMessage.sender.email,
        preview: content.length > 200 ? content.slice(0, 200) + '…' : content,
        carTitle: `${car.brand} ${car.model}`,
        carId,
      }).catch(() => {})
    }

    return NextResponse.json({ message: newMessage });
  } catch (error) {
    return serverError('Failed to send message', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const carId = searchParams.get('carId');
    const peerId = searchParams.get('peerId');

    if (!carId && !peerId) {
      return NextResponse.json({ error: 'Missing carId or peerId' }, { status: 400 });
    }

    const where = carId
      ? {
          carId,
          OR: [
            { senderId: session.user.id },
            { receiverId: session.user.id },
          ],
        }
      : {
          // All messages between current user and peerId, across any car
          OR: [
            { senderId: session.user.id, receiverId: peerId! },
            { senderId: peerId!, receiverId: session.user.id },
          ],
        };

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, email: true, name: true } },
        receiver: { select: { id: true, email: true, name: true } },
        replyTo: true,
      },
    });
    return NextResponse.json({ messages });
  } catch (error) {
    return serverError('Failed to fetch messages', error);
  }
}
