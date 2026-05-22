import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'

const ALLOWED_ROLES = ['User', 'Admin'] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { role } = await request.json()
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: `Role must be one of: ${ALLOWED_ROLES.join(', ')}` }, { status: 400 })
    }

    // Prevent self-demotion
    if (id === session.user.id && role !== 'Admin') {
      return NextResponse.json({ error: 'Cannot demote your own account' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    })
    return NextResponse.json(user)
  } catch (error) {
    return serverError('Failed to update role', error)
  }
}
