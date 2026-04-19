import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const user = await prisma.user.update({
      where: { id },
      data: { sellerVerified: true },
      select: { id: true, name: true, email: true, sellerVerified: true },
    })
    return NextResponse.json(user)
  } catch (error) {
    return serverError('Failed to verify seller', error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const user = await prisma.user.update({
      where: { id },
      data: { sellerVerified: false },
      select: { id: true, name: true, email: true, sellerVerified: true },
    })
    return NextResponse.json(user)
  } catch (error) {
    return serverError('Failed to unverify seller', error)
  }
}
