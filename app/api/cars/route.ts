import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    
    const cars = await prisma.car.findMany({
      where: { status },
      include: {
        owner: { select: { id: true, name: true, email: true, rating: true } },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { bidder: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(cars)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate required fields
    const { brand, model, condition, km, year, power, fuel, startingPrice, auctionEndDate, images } = body
    
    if (!brand || !model || !condition || km === undefined || !year || !power || !fuel || !startingPrice || !auctionEndDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate auction end date is in the future
    if (new Date(auctionEndDate) <= new Date()) {
      return NextResponse.json({ error: 'Auction end date must be in the future' }, { status: 400 })
    }

    const car = await prisma.car.create({
      data: {
        ownerId: session.user.id,
        brand,
        model,
        description: body.description || '',
        specs: body.specs || null,
        condition,
        km: parseInt(km),
        year: parseInt(year),
        power: parseInt(power),
        fuel,
        euroStandard: body.euroStandard || null,
        images: images || [],
        startingPrice: parseFloat(startingPrice),
        currentPrice: parseFloat(startingPrice),
        reservePrice: body.reservePrice ? parseFloat(body.reservePrice) : null,
        auctionEndDate: new Date(auctionEndDate),
        status: 'active',
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(car, { status: 201 })
  } catch (error) {
    console.error('Failed to create car:', error)
    return NextResponse.json({ error: 'Failed to create car' }, { status: 500 })
  }
}
