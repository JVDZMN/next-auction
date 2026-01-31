import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { carId, receiverId, replyToMessageId, content } = await request.json();
    if (!carId || !content) {
      return NextResponse.json({ error: 'Missing carId or content' }, { status: 400 });
    }
    // Find car and owner
    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: { ownerId: true },
    });
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }
    // Use receiverId from body if present, else default to car.ownerId
    const finalReceiverId = receiverId || car.ownerId;
    // Create message (no content field)
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
    return NextResponse.json({ message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const carId = searchParams.get('carId')
    if (!carId) {
      return NextResponse.json({ error: 'Missing carId' }, { status: 400 })
    }
    // Get all messages for this car (for this user)
    const messages = await prisma.message.findMany({
      where: {
        carId,
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, email: true, name: true } },
        receiver: { select: { id: true, email: true, name: true } },
        replyTo: true,
      },
    })
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}
