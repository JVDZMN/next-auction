import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// Like a car
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await prisma.like.create({
      data: {
        userId: session.user.id,
        carId: params.id,
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    // Unique constraint violation means already liked
    return NextResponse.json({ error: 'Already liked or error' }, { status: 400 })
  }
}

// Unlike a car
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await prisma.like.deleteMany({
    where: {
      userId: session.user.id,
      carId: params.id,
    },
  })
  return NextResponse.json({ success: true })
}

// Get all users who liked a car (admin only)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.role || session.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  const likes = await prisma.like.findMany({
    where: { carId: params.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  })
  return NextResponse.json(likes)
}
