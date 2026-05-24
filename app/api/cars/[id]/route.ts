import { NextRequest, NextResponse } from 'next/server'
import { prisma, ownerSelect, bidderSelect } from '@/lib/prisma'
import { serverError } from '@/lib/api'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        owner: { select: ownerSelect },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { bidder: { select: bidderSelect } },
        },
      },
    })

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    return NextResponse.json(car)
  } catch (error) {
    return serverError('Failed to fetch car', error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const car = await prisma.car.findUnique({
      where: { id },
      select: { ownerId: true, fuel: true, _count: { select: { bids: true } } },
    })

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }
    if (car.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (car._count.bids > 0) {
      return NextResponse.json(
        { error: 'Cannot edit a listing that has received bids.' },
        { status: 409 },
      )
    }

    const body = await request.json()
    const { CarCreateSchema } = await import('@/lib/zod')
    const parseResult = CarCreateSchema.partial().safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten() },
        { status: 400 },
      )
    }

    const data = parseResult.data
    const updated = await prisma.car.update({
      where: { id },
      data: {
        ...(data.brand !== undefined && { brand: data.brand }),
        ...(data.model !== undefined && { model: data.model }),
        ...(data.subModel !== undefined && { subModel: data.subModel }),
        ...(data.variant !== undefined && { variant: data.variant }),
        ...(data.bodyType !== undefined && { bodyType: data.bodyType }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.specs !== undefined && { specs: data.specs }),
        ...(data.condition !== undefined && { condition: data.condition }),
        ...(data.km !== undefined && { km: Number(data.km) }),
        ...(data.lastInspectionKm !== undefined && { lastInspectionKm: data.lastInspectionKm !== null ? Number(data.lastInspectionKm) : null }),
        ...(data.year !== undefined && { year: Number(data.year) }),
        ...(data.power !== undefined && { power: Number(data.power) }),
        ...(data.fuel !== undefined && { fuel: (data.fuel || null) as never }),
        ...(data.gearType !== undefined && {
          gearType: (data.gearType || ((data.fuel ?? car.fuel) === 'Electric' ? 'Automatic' : 'Manual')) as never,
        }),
        ...(data.engineSize !== undefined && { engineSize: data.engineSize !== null ? Number(data.engineSize) : null }),
        ...(data.seats !== undefined && { seats: data.seats !== null ? Number(data.seats) : null }),
        ...(data.weight !== undefined && { weight: data.weight !== null ? Number(data.weight) : null }),
        ...(data.licensePlate !== undefined && { licensePlate: data.licensePlate }),
        ...(data.use !== undefined && { use: data.use }),
        ...(data.firstRegistration !== undefined && { firstRegistration: data.firstRegistration ? new Date(data.firstRegistration) : null }),
        ...(data.lastInspection !== undefined && { lastInspection: data.lastInspection ? new Date(data.lastInspection) : null }),
        ...(data.nextInspection !== undefined && { nextInspection: data.nextInspection ? new Date(data.nextInspection) : null }),
        ...(data.streetName !== undefined && { streetName: data.streetName }),
        ...(data.houseNumber !== undefined && { houseNumber: data.houseNumber }),
        ...(data.zipcode !== undefined && { zipcode: data.zipcode }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.images !== undefined && { images: data.images }),
        ...(data.startingPrice !== undefined && { startingPrice: Number(data.startingPrice), currentPrice: Number(data.startingPrice) }),
        ...(data.reservePrice !== undefined && { reservePrice: data.reservePrice !== null ? Number(data.reservePrice) : null }),
        ...(data.auctionEndDate !== undefined && { auctionEndDate: new Date(data.auctionEndDate) }),
        ...(data.auctionStartDate !== undefined && { auctionStartDate: data.auctionStartDate ? new Date(data.auctionStartDate) : null }),
        ...(data.vin !== undefined && { vin: data.vin }),
        ...(data.inspectionReportUrl !== undefined && { inspectionReportUrl: data.inspectionReportUrl }),
        ...(data.serviceHistoryUrls !== undefined && { serviceHistoryUrls: data.serviceHistoryUrls }),
        ...(data.bidIncrement !== undefined && { bidIncrement: data.bidIncrement !== null ? Number(data.bidIncrement) : null }),
        ...(data.isDraft !== undefined && { isDraft: data.isDraft }),
      },
      include: {
        owner: { select: ownerSelect },
        bids: { orderBy: { createdAt: 'desc' }, take: 10, include: { bidder: { select: bidderSelect } } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return serverError('Failed to update car', error)
  }
}
