import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toLocale } from '@/lib/i18n'
import { HomeClient } from '@/components/HomeClient'

const CAR_SELECT = {
  id: true, year: true, brand: true, model: true, subModel: true,
  images: true, currentPrice: true, auctionEndDate: true,
  _count: { select: { bids: true } },
} as const

const activeBase = () => ({
  status: 'active' as const,
  isDraft: false,
  auctionEndDate: { gte: new Date() },
})

async function fetchSegment(ownerRole: 'PRIVATE_USER' | 'BUSINESS_USER') {
  const rows = await prisma.car.findMany({
    where: { ...activeBase(), owner: { role: ownerRole } },
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
    ownerRole,
  }))
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale   = toLocale(rawLocale)
  const session  = await getServerSession(authOptions)
  const role     = session?.user?.role as string | undefined

  // Fetch only what the user can see
  const [privateCars, businessCars] = await Promise.all([
    role === 'BUSINESS_USER' ? [] : fetchSegment('PRIVATE_USER'),
    role === 'PRIVATE_USER'  ? [] : fetchSegment('BUSINESS_USER'),
  ])

  return (
    <HomeClient
      locale={locale}
      isSignedIn={!!session}
      role={role}
      privateCars={privateCars}
      businessCars={businessCars}
    />
  )
}
