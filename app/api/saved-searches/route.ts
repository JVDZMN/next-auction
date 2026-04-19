import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'
import { SavedSearchSchema } from '@/lib/zod'

export async function GET(_request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const searches = await prisma.savedSearch.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ searches })
  } catch (error) {
    return serverError('Failed to fetch saved searches', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parse = SavedSearchSchema.safeParse(body)
    if (!parse.success) return NextResponse.json({ error: 'Invalid input', details: parse.error.flatten() }, { status: 400 })

    const search = await prisma.savedSearch.create({
      data: { userId: session.user.id, ...parse.data },
    })
    return NextResponse.json(search, { status: 201 })
  } catch (error) {
    return serverError('Failed to create saved search', error)
  }
}
