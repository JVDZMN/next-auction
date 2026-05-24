import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toLocale } from '@/lib/i18n'
import { HomeClient } from '@/components/HomeClient'
import carBrandsData from '@/data/car-brands.json'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = toLocale(rawLocale)
  const session = await getServerSession(authOptions)

  const CAROUSEL_BRANDS = carBrandsData.brands.map(b => b.brand)

  const now = new Date()
  const activeWhere = { status: 'active', isDraft: false, auctionEndDate: { gte: now } } as const

  const [rawCars, brandRows] = await Promise.all([
    prisma.car.findMany({
      where: activeWhere,
      select: {
        id: true, year: true, brand: true, model: true, subModel: true,
        images: true, currentPrice: true, auctionEndDate: true,
        _count: { select: { bids: true } },
      },
      orderBy: { bids: { _count: 'desc' } },
      take: 10,
    }),
    prisma.car.groupBy({
      by: ['brand'],
      where: { ...activeWhere, brand: { in: CAROUSEL_BRANDS } },
      _count: { brand: true },
    }),
  ])

  const topCars = rawCars.map(c => ({
    id:             c.id,
    year:           c.year,
    brand:          c.brand,
    model:          c.model,
    subModel:       c.subModel ?? null,
    images:         c.images,
    currentPrice:   c.currentPrice,
    auctionEndDate: c.auctionEndDate.toISOString(),
    bidCount:       c._count.bids,
  }))

  const brandCounts: Record<string, number> = {}
  for (const row of brandRows) brandCounts[row.brand] = row._count.brand

  const activeBrands = carBrandsData.brands
    .map(b => b.brand)
    .filter(brand => (brandCounts[brand] ?? 0) > 0)

  const showcaseImage = topCars[0]?.images[0] ?? null

  return (
    <HomeClient
      locale={locale}
      isSignedIn={!!session}
      topCars={topCars}
      showcaseImage={showcaseImage}
      brandCounts={brandCounts}
      activeBrands={activeBrands}
    />
  )
}
