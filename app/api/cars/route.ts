import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { prisma, ownerSelect, latestBidInclude } from '@/lib/prisma'
import { serverError } from '@/lib/api'
import { CarStatus } from '@prisma/client'
import { sendEmail } from '@/lib/email'

async function notifySavedSearches(car: { id: string; brand: string; model: string; year: number; currentPrice: number; fuel: string | null }) {
  try {
    const searches = await prisma.savedSearch.findMany({
      where: {
        notifyNewListing: true,
        ...(car.brand ? { OR: [{ brand: null }, { brand: car.brand }] } : {}),
      },
      include: { user: { select: { email: true, name: true } } },
    })

    for (const s of searches) {
      if (s.brand && s.brand !== car.brand) continue
      if (s.maxPrice && car.currentPrice > s.maxPrice) continue
      if (s.minYear && car.year < s.minYear) continue
      if (s.fuel && car.fuel !== s.fuel) continue

      void sendEmail({
        to: s.user.email,
        subject: `New listing matches your saved search: ${car.year} ${car.brand} ${car.model}`,
        html: `
          <h2>New matching listing!</h2>
          <p>Hi ${s.user.name ?? 'there'},</p>
          <p>A new car matching your saved search${s.label ? ` "<strong>${s.label}</strong>"` : ''} was just listed:</p>
          <p><strong>${car.year} ${car.brand} ${car.model}</strong> — $${car.currentPrice.toLocaleString()}</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/cars/${car.id}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
            View Listing
          </a>
        `,
      })
    }
  } catch {
    // non-fatal
  }
}

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
      where: { status, isDraft: false },
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
    const isDraft = data.isDraft ?? false
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
        auctionStartDate: data.auctionStartDate ? new Date(data.auctionStartDate) : null,
        status: isDraft ? 'active' : 'active',
        isDraft,
        vin: data.vin || null,
        inspectionReportUrl: data.inspectionReportUrl || null,
        serviceHistoryUrls: data.serviceHistoryUrls || [],
        bidIncrement: data.bidIncrement != null ? Number(data.bidIncrement) : null,
        zipcode: data.zipcode || null,
        city: data.city || null,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify users whose saved searches match this new listing
    if (!isDraft) {
      void notifySavedSearches(car)
    }

    return NextResponse.json(car, { status: 201 });
  } catch (error) {
    return serverError('Failed to create car', error)
  }
}
