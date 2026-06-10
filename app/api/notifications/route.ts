import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { serverError } from '@/lib/api'

export async function GET() {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    return serverError('Failed to fetch notifications', error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await req.json()

    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { read: true },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return serverError('Failed to mark notification as read', error)
  }
}
