import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// Rate a user for a car (one rating per car/user pair)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const { ratedUserId, score, comment } = body
  if (!ratedUserId || typeof score !== 'number') {
    return NextResponse.json({ error: 'Missing ratedUserId or score' }, { status: 400 })
  }
  try {
    const rating = await prisma.rating.upsert({
      where: {
        ratedUserId_raterUserId_carId: {
          ratedUserId,
          raterUserId: session.user.id,
          carId: params.id,
        },
      },
      update: { score, comment },
      create: {
        ratedUserId,
        raterUserId: session.user.id,
        carId: params.id,
        score,
        comment,
      },
    })
    return NextResponse.json(rating)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to rate' }, { status: 400 })
  }
}

// Get all ratings for a car (admin only)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.role || session.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  const ratings = await prisma.rating.findMany({
    where: { carId: params.id },
    include: {
      ratedUser: { select: { id: true, name: true, email: true } },
      raterUser: { select: { id: true, name: true, email: true } },
    },
  })
  return NextResponse.json(ratings)
}
