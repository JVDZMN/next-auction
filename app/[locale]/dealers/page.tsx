import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { toLocale, getDictionary } from '@/lib/i18n'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

async function fetchDealers() {
  const now = new Date()
  const dealers = await prisma.user.findMany({
    where: { role: 'BUSINESS_USER', isApprovedByAdmin: true },
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      _count: {
        select: {
          cars: {
            where: { status: 'active', isDraft: false, auctionEndDate: { gte: now } },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
  return dealers
}

export default async function DealersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale  = toLocale(rawLocale)

  const session = await requireAuth()
  const role    = session?.user?.role
  if (!hasPermission(role, 'canViewDealers')) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/dealers`)
  }

  const [dealers, dict] = await Promise.all([fetchDealers(), getDictionary(locale)])
  const t = dict.dealers
  const dateLocale = locale === 'da' ? 'da-DK' : 'en-GB'

  return (
    <div style={{ backgroundColor: 'var(--page-bg)', minHeight: '100vh' }}>

      {/* Page header */}
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
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>
            {t.label}
          </p>
          <h1 className="text-4xl font-black text-white sm:text-5xl">{t.heading}</h1>
          <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {dealers.length} {t.approvedCount}
          </p>
        </div>
      </div>

      {/* Dealer grid */}
      <div className="mx-auto max-w-6xl px-6 sm:px-10 py-14">
        {dealers.length === 0 ? (
          <p className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
            {t.empty}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dealers.map(dealer => (
              <Link
                key={dealer.id}
                href={`/${locale}/dealers/${dealer.id}`}
                className="group block rounded-xl border overflow-hidden hover:shadow-md transition-shadow duration-200"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'rgba(0,0,0,0.08)' }}
              >
                {/* Dealer header bar */}
                <div
                  className="h-2"
                  style={{ backgroundColor: 'var(--copper)' }}
                />

                <div className="p-6">
                  {/* Avatar / logo */}
                  <div
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-full text-xl font-black text-white"
                    style={{ backgroundColor: 'var(--dark-section)' }}
                  >
                    {dealer.image
                      ? <img src={dealer.image} alt={dealer.name ?? ''} className="h-14 w-14 rounded-full object-cover" />
                      : (dealer.name ?? '?').slice(0, 2).toUpperCase()
                    }
                  </div>

                  <h2
                    className="text-base font-black group-hover:underline underline-offset-2"
                    style={{ color: 'var(--text-body)' }}
                  >
                    {dealer.name ?? t.unnamed}
                  </h2>

                  <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {t.activeAuctions}: <strong style={{ color: 'var(--copper)' }}>{dealer._count.cars}</strong>
                  </p>

                  <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {t.memberSince} {new Date(dealer.createdAt).toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div
                  className="px-6 py-3 flex items-center justify-between border-t text-sm font-semibold"
                  style={{ borderColor: 'rgba(0,0,0,0.06)', color: 'var(--copper)' }}
                >
                  {t.viewAuctions}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
