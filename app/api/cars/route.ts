import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { prisma, ownerSelect, latestBidInclude } from '@/lib/prisma'
import { serverError } from '@/lib/api'
import { CarStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const allowedStatuses: CarStatus[] = [
      'active',
      'completed',
      'cancelled',
      'reserve_not_met',
    ];
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'active') as CarStatus;

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` }, { status: 400 });
    }

    // Only allow normal users to see 'active' cars. All other statuses require admin.
    if (status !== 'active') {
      const session = await requireAdmin()
      if (!session) {
        return NextResponse.json({ error: 'Admin access required to view this status' }, { status: 403 });
      }
    }

    const cars = await prisma.car.findMany({
      where: { status },
      include: {
        owner: { select: ownerSelect },
        bids: latestBidInclude,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(cars);
  } catch (error) {
    return serverError('Failed to fetch cars', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json();
    const { CarCreateSchema } = await import('@/lib/zod');
    const parseResult = CarCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten() }, { status: 400 });
    }
    const data = parseResult.data;
    // Validate auction end date is in the future
    if (new Date(data.auctionEndDate) <= new Date()) {
      return NextResponse.json({ error: 'Auction end date must be in the future' }, { status: 400 });
    }
    const car = await prisma.car.create({
      data: {
        ownerId: session.user.id,
        brand: data.brand,
        model: data.model,
        description: data.description || '',
        specs: data.specs || null,
        condition: data.condition,
        km: Number(data.km),
        year: Number(data.year),
        power: Number(data.power),
        fuel: data.fuel as import('@prisma/client').FuelType,
        images: data.images || [],
        startingPrice: Number(data.startingPrice),
        currentPrice: Number(data.startingPrice),
        reservePrice: data.reservePrice != null ? Number(data.reservePrice) : null,
        auctionEndDate: new Date(data.auctionEndDate),
        status: 'active',
        zipcode: data.zipcode || null,
        city: data.city || null,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json(car, { status: 201 });
  } catch (error) {
    return serverError('Failed to create car', error)
  }
}
