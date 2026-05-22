// Server component — fetches its own data and reads dict directly.
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDictionary, toLocale } from '@/lib/i18n'
import { Header } from '@/components/Header'
import { CarCard } from '@/components/CarCard'
import { Badge } from '@/components/ui/badge'

async function getActiveCars(userId: string) {
  const cars = await prisma.car.findMany({
    where: { status: 'active', isDraft: false, auctionEndDate: { gte: new Date() } },
    select: {
      id: true, year: true, brand: true, model: true, subModel: true,
      images: true, condition: true, fuel: true, km: true, city: true,
      bodyType: true, currentPrice: true, auctionEndDate: true,
      owner: { select: { name: true } },
      _count: { select: { bids: true } },
      likedBy: { where: { userId }, select: { userId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })
  return cars.map((car: (typeof cars)[number]) => ({ ...car, isLiked: car.likedBy.length > 0 }))
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = toLocale(rawLocale)

  const [session, dict] = await Promise.all([
    getServerSession(authOptions),
    getDictionary(locale),
  ])

  const cars = await getActiveCars(session?.user?.id ?? '')
  const t = dict.home

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />

      {/* Hero */}
      <section className="bg-stone-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-5">{t.hero.title}</h1>
          <p className="text-lg text-stone-300 mb-10">{t.hero.subtitle}</p>
          <div className="flex gap-4 justify-center">
            <Link
              href={`/${locale}/cars`}
              className="px-8 py-3 bg-white text-stone-900 font-semibold rounded-lg hover:bg-stone-100 transition-colors"
            >
              {t.hero.browse}
            </Link>
            <Link
              href={session ? `/${locale}/cars/create` : `/${locale}/auth/signin`}
              className="px-8 py-3 border border-white/40 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              {t.hero.sell}
            </Link>
          </div>
        </div>
      </section>

      {/* Active auctions */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-stone-900">
            {t.activeAuctions}
            {cars.length > 0 && (
              <Badge variant="secondary" className="ml-2 font-normal text-base">{cars.length}</Badge>
            )}
          </h2>
          <Link href={`/${locale}/cars`} className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">
            {t.viewAll} →
          </Link>
        </div>

        {cars.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-stone-100">
            <p className="text-stone-500">{t.noAuctions}</p>
            <p className="text-stone-400 text-sm mt-1">{t.checkBack}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cars.map(car => (
              <CarCard
                key={car.id}
                id={car.id}
                year={car.year}
                brand={car.brand}
                model={car.model}
                subModel={car.subModel}
                images={car.images}
                condition={car.condition}
                fuel={car.fuel}
                km={car.km}
                city={car.city}
                bodyType={car.bodyType}
                currentPrice={car.currentPrice}
                auctionEndDate={car.auctionEndDate}
                bidCount={car._count.bids}
                isLiked={car.isLiked}
                owner={car.owner}
              />
            ))}
          </div>
        )}
      </main>

      {/* Features */}
      <section className="bg-white border-t border-stone-100 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center text-stone-900 mb-14">
            {t.features.title}
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {(
              [
                { key: 'realtime', icon: BoltIcon },
                { key: 'verified', icon: ShieldIcon },
                { key: 'secure',   icon: LockIcon  },
              ] as const
            ).map(({ key, icon: Icon }) => (
              <div key={key} className="text-center">
                <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-stone-700" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">{t.features[key].title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{t.features[key].body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}
