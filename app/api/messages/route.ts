import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { carId, message } = await request.json()
    if (!carId || !message) {
      return NextResponse.json({ error: 'Missing carId or message' }, { status: 400 })
    }
    // Find car and owner
    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: { ownerId: true },
    })
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }
    // Create message
    const newMessage = await prisma.message.create({
      data: {
        carId,
        senderEmail: session.user.email,
        receiverId: car.ownerId,
        content: message,
      },
    })
    return NextResponse.json({ message: newMessage })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
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
          { senderEmail: session.user.email },
          { receiverId: session.user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}
