import Link from 'next/link'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { toLocale, getDictionary } from '@/lib/i18n'
import { CarCard } from '@/components/CarCard'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export default async function DealerProfilePage({
  params,
}: {
  params: Promise<{ locale: string; dealerId: string }>
}) {
  const { locale: rawLocale, dealerId } = await params
  const locale = toLocale(rawLocale)
  const now    = new Date()

  const session = await requireAuth()
  const role    = session?.user?.role
  if (!hasPermission(role, 'canViewDealers')) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/dealers/${dealerId}`)
  }

  const [dealer, dict] = await Promise.all([
    prisma.user.findUnique({
      where: { id: dealerId, role: 'BUSINESS_USER', isApprovedByAdmin: true },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
        createdAt: true,
        cars: {
          where: { isDraft: false, status: { in: ['active', 'completed'] } },
          select: {
            id: true, year: true, brand: true, model: true, subModel: true,
            images: true, condition: true, fuel: true, km: true, city: true,
            bodyType: true, currentPrice: true, auctionEndDate: true,
            owner: { select: { name: true, role: true } },
            _count: { select: { bids: true } },
            status: true,
          },
          orderBy: { auctionEndDate: 'desc' },
          take: 24,
        },
      },
    }),
    getDictionary(locale),
  ])

  if (!dealer) notFound()

  const t = dict.dealers
  const dateLocale = locale === 'da' ? 'da-DK' : 'en-GB'

  const activeCars    = dealer.cars.filter(c => c.status === 'active' && new Date(c.auctionEndDate) >= now)
  const completedCars = dealer.cars.filter(c => c.status === 'completed')

  return (
    <div style={{ backgroundColor: 'var(--page-bg)', minHeight: '100vh' }}>

      {/* Dealer header */}
      <div style={{ backgroundColor: 'var(--dark-section)' }} className="relative overflow-hidden py-16 sm:py-20">
        <div
          aria-hidden
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%',
            background: 'var(--copper)',
            clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)',
            opacity: 0.1, pointerEvents: 'none',
          }}
        />
        <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-10">
          <Link href={`/${locale}/dealers`} className="mb-6 inline-block text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {t.backToList}
          </Link>

          <div className="flex items-center gap-5">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-black text-white shrink-0"
              style={{ backgroundColor: 'var(--copper)' }}
            >
              {dealer.image
                ? <Image src={dealer.image} alt={dealer.name ?? ''} width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
                : (dealer.name ?? '?').slice(0, 2).toUpperCase()
              }
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>
                {t.approvedDealer}
              </p>
              <h1 className="text-3xl font-black text-white sm:text-4xl">
                {dealer.name ?? t.unnamed}
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t.memberSince} {new Date(dealer.createdAt).toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-8">
            {[
              { label: t.activeAuctions, value: activeCars.length },
              { label: t.completedSales, value: completedCars.length },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active auctions */}
      <div className="mx-auto max-w-6xl px-6 sm:px-10 py-14">
        {activeCars.length > 0 && (
          <section className="mb-14">
            <h2 className="mb-6 text-2xl font-black" style={{ color: 'var(--text-body)' }}>
              {t.activeAuctions}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeCars.map((car, i) => (
                <CarCard
                  key={car.id}
                  {...car}
                  auctionEndDate={car.auctionEndDate.toISOString()}
                  subModel={car.subModel ?? undefined}
                  bidCount={car._count.bids}
                  ownerRole="BUSINESS_USER"
                  priority={i < 3}
                />
              ))}
            </div>
          </section>
        )}

        {completedCars.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-black" style={{ color: 'var(--text-body)' }}>
              {t.previousSales}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {completedCars.slice(0, 6).map(car => (
                <CarCard
                  key={car.id}
                  {...car}
                  auctionEndDate={car.auctionEndDate.toISOString()}
                  subModel={car.subModel ?? undefined}
                  bidCount={car._count.bids}
                  ownerRole="BUSINESS_USER"
                />
              ))}
            </div>
          </section>
        )}

        {dealer.cars.length === 0 && (
          <p className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
            {t.noActiveCars}
          </p>
        )}
      </div>
    </div>
  )
}
