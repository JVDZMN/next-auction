import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Like a car
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAuth()
  if (!session) {
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
  const session = await requireAuth()
  if (!session) {
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
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  const likes = await prisma.like.findMany({
    where: { carId: params.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  })
  return NextResponse.json(likes)
}
