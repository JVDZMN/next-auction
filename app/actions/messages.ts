'use server'

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { emitToUser, emitToCar } from '@/lib/socket-server'
import { sendMessageNotification } from '@/lib/email'

const MSG_RATE_LIMIT = { limit: 10, windowMs: 60_000 }

interface SendMessageInput {
  carId: string
  receiverId?: string
  replyToMessageId?: string
  content: string
}

type MessageResult = { error: string } | { messageId: string; message: object }

export async function sendMessage(input: SendMessageInput): Promise<MessageResult> {
  const session = await requireAuth()
  if (!session) return { error: 'Unauthorized' }

  const rl = await rateLimit(`msg:${session.user.id}`, MSG_RATE_LIMIT)
  if (!rl.allowed) return { error: 'Too many messages. Please slow down.' }

  const { carId, receiverId, replyToMessageId, content } = input
  if (!carId || !content) return { error: 'Missing carId or content' }

  const car = await prisma.car.findUnique({
    where: { id: carId },
    select: { ownerId: true, brand: true, model: true },
  })
  if (!car) return { error: 'Car not found' }

  const finalReceiverId = receiverId || car.ownerId
  const newMessage = await prisma.message.create({
    data: {
      carId,
      senderId: session.user.id,
      receiverId: finalReceiverId,
      content,
      replyToMessageId: replyToMessageId || null,
    },
    include: {
      sender:   { select: { id: true, email: true, name: true } },
      receiver: { select: { id: true, email: true, name: true } },
      replyTo: true,
    },
  })

  const notification = await prisma.notification.create({
    data: {
      userId: finalReceiverId,
      type: 'new_message',
      message: `New message from ${newMessage.sender.name || newMessage.sender.email}`,
      carId,
    },
  })

  emitToUser(finalReceiverId, 'new-notification', {
    id: notification.id,
    message: notification.message,
    type: notification.type,
    carId: notification.carId,
    createdAt: notification.createdAt,
    senderId: session.user.id,
    senderName: newMessage.sender.name || newMessage.sender.email,
    senderImage: null,
  })
  emitToUser(finalReceiverId, 'new-message', newMessage)
  emitToCar(carId, 'new-message', newMessage)

  if (newMessage.receiver.email) {
    sendMessageNotification({
      to: newMessage.receiver.email,
      senderName: newMessage.sender.name || newMessage.sender.email,
      preview: content.length > 200 ? content.slice(0, 200) + '…' : content,
      carTitle: `${car.brand} ${car.model}`,
      carId,
    }).catch(() => {})
  }

  return { messageId: newMessage.id, message: newMessage }
}
