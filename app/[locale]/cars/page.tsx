import { CarsClient, CarsResponse } from './CarsClient'
import { prisma, ownerSelect, latestBidInclude } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { CarStatus, FuelType, UserType } from '@prisma/client'

const KM_MAX = 500_000

async function fetchCars(params: Record<string, string>): Promise<CarsResponse> {
  const brand     = params.brand     || undefined
  const model     = params.model     || undefined
  const city      = params.city      || undefined
  const fuel      = params.fuel      || undefined
  const bodyType  = params.bodyType  || undefined
  const minPrice  = params.minPrice  ? Number(params.minPrice) : undefined
  const maxPrice  = params.maxPrice  ? Number(params.maxPrice) : undefined
  const minYear   = params.minYear   ? Number(params.minYear)  : undefined
  const maxYear   = params.maxYear   ? Number(params.maxYear)  : undefined
  const minKm     = params.minKm     ? Number(params.minKm)    : undefined
  const maxKm     = params.maxKm     ? Number(params.maxKm)    : undefined
  const synStatus = params.synStatus || undefined
  const likedOnly = params.liked === 'true'
  const segment   = params.segment === 'business' ? 'BUSINESS' : params.segment === 'private' ? 'PRIVATE' : undefined
  const page      = Math.max(1, Number(params.page || 1))
  const pageSize  = 12
  const sortBy    = params.sortBy || 'newest'

  let likedByUserId: string | undefined
  if (likedOnly) {
    const session = await requireAuth()
    likedByUserId = session?.user.id
  }

  const orderBy =
    sortBy === 'priceAsc'   ? { currentPrice: 'asc'   as const } :
    sortBy === 'priceDesc'  ? { currentPrice: 'desc'  as const } :
    sortBy === 'endingSoon' ? { auctionEndDate: 'asc' as const } :
                              { createdAt: 'desc'     as const }

  const where = {
    status: 'active' as CarStatus,
    isDraft: false,
    ...(brand    && { brand }),
    ...(model    && { model:    { contains: model,    mode: 'insensitive' as const } }),
    ...(city     && { city:     { contains: city,     mode: 'insensitive' as const } }),
    ...(fuel     && { fuel:     fuel as FuelType }),
    ...(bodyType && { bodyType: { contains: bodyType, mode: 'insensitive' as const } }),
    ...((minPrice !== undefined || maxPrice !== undefined) && {
      currentPrice: {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      },
    }),
    ...((minYear !== undefined || maxYear !== undefined) && {
      year: {
        ...(minYear !== undefined && { gte: minYear }),
        ...(maxYear !== undefined && { lte: maxYear }),
      },
    }),
    ...((minKm !== undefined || maxKm !== undefined) && {
      km: {
        ...(minKm !== undefined && { gte: minKm }),
        ...(maxKm !== undefined && { lte: maxKm }),
      },
    }),
    ...(synStatus === 'valid'   && { nextInspection: { gt: new Date() } }),
    ...(synStatus === 'expired' && { nextInspection: { lte: new Date() } }),
    ...(likedByUserId && { likedBy: { some: { userId: likedByUserId } } }),
    ...(segment && { owner: { userType: segment as UserType } }),
  }

  const [total, cars] = await Promise.all([
    prisma.car.count({ where }),
    prisma.car.findMany({
      where,
      include: {
        owner: { select: ownerSelect },
        bids: latestBidInclude,
        _count: { select: { bids: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return {
    cars: cars.map(car => ({
      ...car,
      auctionEndDate: car.auctionEndDate.toISOString(),
    })) as unknown as CarsResponse['cars'],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params      = await searchParams
  const initialData = await fetchCars(params)
  return <CarsClient initialData={initialData} />
}
