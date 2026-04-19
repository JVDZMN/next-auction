import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'
import { ProxyBidSchema } from '@/lib/zod'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const carId = new URL(request.url).searchParams.get('carId')
    if (!carId) return NextResponse.json({ error: 'carId required' }, { status: 400 })

    const proxy = await prisma.proxyBid.findUnique({
      where: { carId_bidderId: { carId, bidderId: session.user.id } },
    })
    return NextResponse.json({ proxy })
  } catch (error) {
    return serverError('Failed to fetch proxy bid', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parse = ProxyBidSchema.safeParse(body)
    if (!parse.success) return NextResponse.json({ error: 'Invalid input', details: parse.error.flatten() }, { status: 400 })

    const car = await prisma.car.findUnique({ where: { id: parse.data.carId } })
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    if (car.status !== 'active') return NextResponse.json({ error: 'Auction is not active' }, { status: 400 })
    if (car.ownerId === session.user.id) return NextResponse.json({ error: 'Cannot proxy bid on your own car' }, { status: 400 })
    if (parse.data.maxAmount <= car.currentPrice) {
      return NextResponse.json({ error: `Max amount must be greater than current price $${car.currentPrice}` }, { status: 400 })
    }

    const proxy = await prisma.proxyBid.upsert({
      where: { carId_bidderId: { carId: parse.data.carId, bidderId: session.user.id } },
      create: { carId: parse.data.carId, bidderId: session.user.id, maxAmount: parse.data.maxAmount },
      update: { maxAmount: parse.data.maxAmount, isActive: true },
    })
    return NextResponse.json(proxy, { status: 201 })
  } catch (error) {
    return serverError('Failed to set proxy bid', error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const carId = new URL(request.url).searchParams.get('carId')
    if (!carId) return NextResponse.json({ error: 'carId required' }, { status: 400 })

    await prisma.proxyBid.updateMany({
      where: { carId, bidderId: session.user.id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError('Failed to cancel proxy bid', error)
  }
}
