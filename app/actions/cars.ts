'use server'

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CarCreateSchema } from '@/lib/zod'
import { sendEmail } from '@/lib/email'
import { FuelType, GearType } from '@prisma/client'

type LikeResult      = { error: string } | { liked: boolean }
type CreateCarResult = { error: string } | { carId: string }

export async function toggleLike(carId: string, currentlyLiked: boolean): Promise<LikeResult> {
  const session = await requireAuth()
  if (!session) return { error: 'Unauthorized' }

  if (currentlyLiked) {
    await prisma.like.deleteMany({ where: { userId: session.user.id, carId } })
  } else {
    try {
      await prisma.like.create({ data: { userId: session.user.id, carId } })
    } catch {
      return { error: 'Already liked or an error occurred' }
    }
  }

  return { liked: !currentlyLiked }
}

export async function createCar(input: unknown): Promise<CreateCarResult> {
  const session = await requireAuth()
  if (!session) return { error: 'Unauthorized' }

  const parse = CarCreateSchema.safeParse(input)
  if (!parse.success) return { error: 'Invalid input' }
  const data = parse.data

  if (new Date(data.auctionEndDate) <= new Date())
    return { error: 'Auction end date must be in the future' }

  const isDraft = data.isDraft ?? false

  const car = await prisma.car.create({
    data: {
      ownerId:             session.user.id,
      brand:               data.brand,
      model:               data.model,
      description:         data.description || '',
      specs:               data.specs || null,
      condition:           data.condition,
      km:                  Number(data.km),
      lastInspectionKm:    data.lastInspectionKm != null ? Number(data.lastInspectionKm) : null,
      year:                Number(data.year),
      power:               Number(data.power),
      fuel:                data.fuel as FuelType,
      images:              data.images || [],
      startingPrice:       Number(data.startingPrice),
      currentPrice:        Number(data.startingPrice),
      reservePrice:        data.reservePrice != null ? Number(data.reservePrice) : null,
      auctionEndDate:      new Date(data.auctionEndDate),
      auctionStartDate:    data.auctionStartDate ? new Date(data.auctionStartDate) : null,
      status:              'active',
      isDraft,
      vin:                 data.vin || null,
      subModel:            data.subModel || null,
      variant:             data.variant || null,
      bodyType:            data.bodyType || null,
      category:            data.category || null,
      gearType:            (data.gearType || (data.fuel === 'Electric' ? 'Automatic' : 'Manual')) as GearType,
      engineSize:          data.engineSize != null ? Number(data.engineSize) : null,
      seats:               data.seats != null ? Number(data.seats) : null,
      weight:              data.weight != null ? Number(data.weight) : null,
      licensePlate:        data.licensePlate || null,
      use:                 data.use || null,
      firstRegistration:   data.firstRegistration ? new Date(data.firstRegistration) : null,
      lastInspection:      data.lastInspection ? new Date(data.lastInspection) : null,
      nextInspection:      data.nextInspection ? new Date(data.nextInspection) : null,
      inspectionReportUrl: data.inspectionReportUrl || null,
      serviceHistoryUrls:  data.serviceHistoryUrls || [],
      bidIncrement:        data.bidIncrement != null ? Number(data.bidIncrement) : null,
      streetName:          data.streetName || null,
      houseNumber:         data.houseNumber || null,
      zipcode:             data.zipcode || null,
      city:                data.city || null,
      latitude:            data.latitude  ?? null,
      longitude:           data.longitude ?? null,
    },
    include: { owner: { select: { id: true, name: true, email: true } } },
  })

  if (!isDraft) {
    void notifySavedSearches(car)
  }

  return { carId: car.id }
}

async function notifySavedSearches(car: {
  id: string; brand: string; model: string; year: number; currentPrice: number; fuel: string | null
}) {
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
          <p><strong>${car.year} ${car.brand} ${car.model}</strong> — ${car.currentPrice.toLocaleString('da-DK')} kr</p>
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
