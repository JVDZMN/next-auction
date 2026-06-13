import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toLocale } from '@/lib/i18n'
import { HomeMarketplace } from '@/components/HomeMarketplace'
import {
  getMarketFilter,
  getFeaturedAuctions,
  getAuctionGrid,
  type SortMode,
} from '@/lib/auction-queries'

const SORT_MODES: SortMode[] = ['endingSoon', 'newest', 'noReserve', 'lowMileage']

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale  = toLocale(rawLocale)
  const session = await getServerSession(authOptions)
  const role    = session?.user?.role as string | undefined
  const market  = getMarketFilter(role)

  const [featured, ...gridResults] = await Promise.all([
    getFeaturedAuctions(market, 10),
    ...SORT_MODES.map(sort => getAuctionGrid(market, sort, 12)),
  ])

  const bySort = Object.fromEntries(
    SORT_MODES.map((sort, i) => [sort, gridResults[i]])
  ) as Record<SortMode, typeof gridResults[number]>

  const carsHref =
    role === 'BUSINESS_USER'
      ? `/${locale}/cars?segment=business`
      : `/${locale}/cars?segment=private`

  return (
    <HomeMarketplace
      locale={locale}
      isSignedIn={!!session}
      featured={featured}
      bySort={bySort}
      carsHref={carsHref}
    />
  )
}
