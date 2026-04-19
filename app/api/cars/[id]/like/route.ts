import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Update watchlist notification preference
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { notifyNearClose } = await request.json()
  await prisma.like.updateMany({
    where: { userId: session.user.id, carId: id },
    data: { notifyNearClose: Boolean(notifyNearClose) },
  })
  return NextResponse.json({ success: true })
}

// Like a car
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    await prisma.like.create({
      data: {
        userId: session.user.id,
        carId: id,
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    // Unique constraint violation means already liked
    return NextResponse.json({ error: 'Already liked or error' }, { status: 400 })
  }
}

// Unlike a car
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  await prisma.like.deleteMany({
    where: {
      userId: session.user.id,
      carId: id,
    },
  })
  return NextResponse.json({ success: true })
}

// Get all users who liked a car (admin only)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  const { id } = await params
  const likes = await prisma.like.findMany({
    where: { carId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
  })
  return NextResponse.json(likes)
}
