import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
import { z } from 'zod'

const bodySchema = z.object({
  body: z.string().min(1).max(500),
  parentId: z.string().nullable().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: carId } = await params

  const comments = await prisma.comment.findMany({
    where: { carId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      body: true,
      createdAt: true,
      parentId: true,
      author: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({ comments })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: carId } = await params

  const car = await prisma.car.findUnique({ where: { id: carId }, select: { id: true } })
  if (!car) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { body, parentId } = parsed.data

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } })
    if (!parent || parent.carId !== carId || parent.parentId !== null) {
      return NextResponse.json({ error: 'Invalid parent' }, { status: 400 })
    }
  }

  const comment = await prisma.comment.create({
    data: {
      carId,
      authorId: session.user.id,
      body,
      parentId: parentId ?? null,
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      parentId: true,
      author: { select: { id: true, name: true } },
    },
  })

  await pusherServer.trigger(`car-${carId}`, 'new-comment', comment)

  return NextResponse.json(comment, { status: 201 })
}
