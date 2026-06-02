import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toLocale } from '@/lib/i18n'
import { HomeClient } from '@/components/HomeClient'

const CAR_SELECT = {
  id: true, year: true, brand: true, model: true, subModel: true,
  images: true, currentPrice: true, auctionEndDate: true,
  owner: { select: { userType: true } },
  _count: { select: { bids: true } },
} as const

const now        = new Date()
const activeBase = { status: 'active' as const, isDraft: false, auctionEndDate: { gte: now } }

async function fetchSegment(userType: 'PRIVATE' | 'BUSINESS') {
  const rows = await prisma.car.findMany({
    where: { ...activeBase, owner: { userType } },
    select: CAR_SELECT,
    orderBy: { bids: { _count: 'desc' } },
    take: 3,
  })
  return rows.map(c => ({
    id:             c.id,
    year:           c.year,
    brand:          c.brand,
    model:          c.model,
    subModel:       c.subModel ?? null,
    images:         c.images,
    currentPrice:   c.currentPrice,
    auctionEndDate: c.auctionEndDate.toISOString(),
    bidCount:       c._count.bids,
    ownerUserType:  userType,
  }))
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale  = toLocale(rawLocale)
  const session = await getServerSession(authOptions)

  const [privateCars, businessCars] = await Promise.all([
    fetchSegment('PRIVATE'),
    fetchSegment('BUSINESS'),
  ])

  return (
    <HomeClient
      locale={locale}
      isSignedIn={!!session}
      privateCars={privateCars}
      businessCars={businessCars}
    />
  )
}
