import { prisma } from '@/lib/prisma'

export type Market = 'PRIVATE_USER' | 'BUSINESS_USER'

export type SortMode = 'endingSoon' | 'newest' | 'noReserve' | 'lowMileage'

export function getMarketFilter(role: string | undefined): Market {
  if (role === 'BUSINESS_USER') return 'BUSINESS_USER'
  return 'PRIVATE_USER'
}

const activeBase = () => ({
  status: 'active' as const,
  isDraft: false,
  auctionEndDate: { gte: new Date() },
})

const CAR_SELECT = {
  id: true,
  year: true,
  brand: true,
  model: true,
  subModel: true,
  images: true,
  condition: true,
  fuel: true,
  km: true,
  city: true,
  bodyType: true,
  currentPrice: true,
  auctionEndDate: true,
  reservePrice: true,
  _count: { select: { bids: true } },
  owner: { select: { name: true, role: true } },
} as const

export type AuctionRow = {
  id: string
  year: number
  brand: string
  model: string
  subModel: string | null
  images: string[]
  condition: string
  fuel: string | null
  km: number
  city: string | null
  bodyType: string | null
  currentPrice: number
  auctionEndDate: string
  bidCount: number
  reservePrice: number | null
  ownerRole: Market
  owner: { name: string | null }
}

function serialize(car: {
  id: string
  year: number
  brand: string
  model: string
  subModel: string | null
  images: string[]
  condition: string
  fuel: string | null
  km: number
  city: string | null
  bodyType: string | null
  currentPrice: number
  auctionEndDate: Date
  reservePrice: number | null
  _count: { bids: number }
  owner: { name: string | null; role: string }
}): AuctionRow {
  return {
    id: car.id,
    year: car.year,
    brand: car.brand,
    model: car.model,
    subModel: car.subModel ?? null,
    images: car.images,
    condition: car.condition,
    fuel: car.fuel ?? null,
    km: car.km,
    city: car.city ?? null,
    bodyType: car.bodyType ?? null,
    currentPrice: car.currentPrice,
    auctionEndDate: car.auctionEndDate.toISOString(),
    bidCount: car._count.bids,
    reservePrice: car.reservePrice ?? null,
    ownerRole: car.owner.role as Market,
    owner: { name: car.owner.name },
  }
}

export async function getFeaturedAuctions(market: Market, take = 10): Promise<AuctionRow[]> {
  const cars = await prisma.car.findMany({
    where: {
      ...activeBase(),
      owner: { role: market },
    },
    select: CAR_SELECT,
    orderBy: [
      { currentPrice: 'desc' },
      { auctionEndDate: 'asc' },
    ],
    take,
  })
  return cars.map(serialize)
}

export async function getAuctionGrid(
  market: Market,
  sort: SortMode = 'endingSoon',
  take = 12,
): Promise<AuctionRow[]> {
  const where = {
    ...activeBase(),
    owner: { role: market },
    ...(sort === 'noReserve' ? { reservePrice: null } : {}),
  }

  const orderBy =
    sort === 'newest'     ? { createdAt: 'desc' as const } :
    sort === 'lowMileage' ? { km: 'asc' as const } :
    { auctionEndDate: 'asc' as const }

  const cars = await prisma.car.findMany({ where, select: CAR_SELECT, orderBy, take })
  return cars.map(serialize)
}
