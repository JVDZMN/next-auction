import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
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
      const session = await getServerSession(authOptions);
      if (!session?.user?.role || session.user.role !== 'Admin') {
        return NextResponse.json({ error: 'Admin access required to view this status' }, { status: 403 });
      }
    }

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
    });

    return NextResponse.json(cars);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('DEBUG SESSION:', session)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized', debugSession: session }, { status: 401 })
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
        km: parseInt(data.km as any),
        year: parseInt(data.year as any),
        power: parseInt(data.power as any),
        fuel: data.fuel as import('@prisma/client').FuelType,
        euroStandard: data.euroStandard ? (data.euroStandard as import('@prisma/client').EuroStandard) : null,
        images: data.images || [],
        startingPrice: parseFloat(data.startingPrice as any),
        currentPrice: parseFloat(data.startingPrice as any),
        reservePrice: data.reservePrice ? parseFloat(data.reservePrice as any) : null,
        auctionEndDate: new Date(data.auctionEndDate),
        status: 'active',
        addressLine: data.addressLine || null,
        zipcode: data.zipcode || null,
        city: data.city || null,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json(car, { status: 201 });
  } catch (error) {
    console.error('Failed to create car:', error)
    return NextResponse.json({ error: 'Failed to create car' }, { status: 500 })
  }
}
