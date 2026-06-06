import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'

export async function GET() {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        dealerDescription: true,
        dealerLogoUrl: true,
        dealerCity: true,
        dealerWebsite: true,
      },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json({ user })
  } catch (error) {
    return serverError('Failed to fetch profile', error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (session.user.role !== 'BUSINESS_USER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only business accounts can update dealer profile' }, { status: 403 })
    }

    const body = await request.json()
    const { dealerDescription, dealerLogoUrl, dealerCity, dealerWebsite } = body

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        dealerDescription: typeof dealerDescription === 'string' ? dealerDescription.trim() || null : undefined,
        dealerLogoUrl:     typeof dealerLogoUrl === 'string'     ? dealerLogoUrl.trim() || null     : undefined,
        dealerCity:        typeof dealerCity === 'string'        ? dealerCity.trim() || null         : undefined,
        dealerWebsite:     typeof dealerWebsite === 'string'     ? dealerWebsite.trim() || null      : undefined,
      },
      select: { id: true, dealerDescription: true, dealerLogoUrl: true, dealerCity: true, dealerWebsite: true },
    })

    return NextResponse.json({ user })
  } catch (error) {
    return serverError('Failed to update profile', error)
  }
}
