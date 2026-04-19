import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const search = await prisma.savedSearch.findUnique({ where: { id } })
    if (!search || search.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.savedSearch.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError('Failed to delete saved search', error)
  }
}
