import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toLocale } from '@/lib/i18n'
import { HomeClient } from '@/components/HomeClient'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = toLocale(rawLocale)
  const session = await getServerSession(authOptions)

  const rawCars = await prisma.car.findMany({
    where: { status: 'active', isDraft: false, auctionEndDate: { gte: new Date() } },
    select: {
      id: true, year: true, brand: true, model: true, subModel: true,
      images: true, currentPrice: true, auctionEndDate: true,
      _count: { select: { bids: true } },
    },
    orderBy: { bids: { _count: 'desc' } },
    take: 10,
  })

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

  const showcaseImage = topCars[0]?.images[0] ?? null

  return (
    <HomeClient
      locale={locale}
      isSignedIn={!!session}
      topCars={topCars}
      showcaseImage={showcaseImage}
    />
  )
}
