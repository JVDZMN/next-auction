import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'

// GET /api/user/gdpr — download all personal data
export async function GET() {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        bids:          { select: { id: true, amount: true, createdAt: true, carId: true } },
        cars:          { select: { id: true, brand: true, model: true, year: true, status: true, currentPrice: true, createdAt: true } },
        savedSearches: true,
        proxyBids:     { select: { id: true, carId: true, maxAmount: true, isActive: true } },
        notifications: { select: { id: true, type: true, message: true, read: true, createdAt: true } },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { password: _pw, ...safeUser } = user as typeof user & { password?: unknown }
    void _pw

    return NextResponse.json(
      { exportedAt: new Date().toISOString(), data: safeUser },
      {
        headers: {
          'Content-Disposition': 'attachment; filename="my-data.json"',
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    return serverError('Failed to export data', error)
  }
}

// DELETE /api/user/gdpr — anonymise account and erase personal data
// Bids are retained for auction integrity but unlinked from PII.
export async function DELETE() {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id

    await prisma.$transaction(async tx => {
      await tx.proxyBid.deleteMany({ where: { bidderId: userId } })
      await tx.savedSearch.deleteMany({ where: { userId } })
      await tx.notification.deleteMany({ where: { userId } })
      await tx.like.deleteMany({ where: { userId } })
      await tx.message.deleteMany({ where: { senderId: userId } })
      await tx.message.deleteMany({ where: { receiverId: userId } })

      await tx.user.update({
        where: { id: userId },
        data: {
          name:              null,
          email:             `deleted-${userId}@gdpr.invalid`,
          image:             null,
          cvrNumber:         null,
          dealerDescription: null,
          dealerLogoUrl:     null,
          dealerCity:        null,
          dealerWebsite:     null,
        },
      })
    })

    return NextResponse.json({ deleted: true })
  } catch (error) {
    return serverError('Failed to delete account', error)
  }
}
