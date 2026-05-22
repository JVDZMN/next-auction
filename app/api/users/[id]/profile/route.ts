import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'

// GET /api/users/[id]/profile
// GDPR-safe public profile: name, registration date, successful purchases, MitID status.
// Strictly excludes email, phone, and other PII.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const [user, successfulPurchases] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          createdAt: true,
          mitIdVerified: true,
          // Explicitly omit: email, password, googleId, image (may contain real name), sessions, etc.
        },
      }),
      // Count bids that are the winning bid on a completed auction
      prisma.bid.count({
        where: {
          bidderId: id,
          wonCar: { status: 'completed' },
        },
      }),
    ])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      name: user.name ?? 'Anonymous',
      memberSince: user.createdAt,
      successfulPurchases,
      verifiedBuyer: user.mitIdVerified,
    })
  } catch (error) {
    return serverError('Failed to fetch user profile', error)
  }
}
