
export async function POST(request: NextRequest) {
  try {
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { carId, receiverId, replyToMessageId, content } = await request.json();
    if (!carId || !content) {
      return NextResponse.json({ error: 'Missing carId or content' }, { status: 400 });
    }
    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: { ownerId: true },
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
    return NextResponse.json({ message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const carId = searchParams.get('carId');
    if (!carId) {
      return NextResponse.json({ error: 'Missing carId' }, { status: 400 });
    }
    const messages = await prisma.message.findMany({
      where: {
        carId: carId || undefined,
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
    });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
