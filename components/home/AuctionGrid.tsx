'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CarCard } from '@/components/CarCard'
import { useDict, useLocale } from '@/lib/i18n/context'
import type { AuctionRow, SortMode } from '@/lib/auction-queries'

interface Props {
  bySort: Record<SortMode, AuctionRow[]>
  locale: string
  carsHref: string
}

const SORT_MODES: SortMode[] = ['endingSoon', 'newest', 'noReserve', 'lowMileage']

export function AuctionGrid({ bySort, carsHref }: Props) {
  const [active, setActive] = useState<SortMode>('endingSoon')
  const locale = useLocale()
  const t = useDict().home.marketplace

  const tabLabel: Record<SortMode, string> = {
    endingSoon: t.sortEndingSoon,
    newest: t.sortNewest,
    noReserve: t.sortNoReserve,
    lowMileage: t.sortLowMileage,
  }

  const cars = bySort[active]

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
      {/* Sort tabs */}
      <div
        className="flex items-center gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {SORT_MODES.map(mode => (
          <button
            key={mode}
            type="button"
            onClick={() => setActive(mode)}
            className="shrink-0 rounded-t px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap"
            style={
              active === mode
                ? { color: 'var(--copper)', borderBottom: '2px solid var(--copper)', marginBottom: '-1px', background: 'none' }
                : { color: 'var(--text-muted)', borderBottom: '2px solid transparent', marginBottom: '-1px', background: 'none' }
            }
          >
            {tabLabel[mode]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {cars.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
          <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-base font-bold mb-2" style={{ color: 'var(--text-body)' }}>
            {t.emptyHeading}
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            {t.emptyBody}
          </p>
          <Link
            href={`/${locale}/auth/signup`}
            className="inline-flex items-center justify-center rounded px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-85"
            style={{ backgroundColor: 'var(--copper)' }}
          >
            {t.emptyCta}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cars.map((car, i) => (
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
              bidCount={car.bidCount}
              reservePrice={car.reservePrice}
              owner={car.owner}
              ownerRole={car.ownerRole}
              priority={i < 4}
            />
          ))}
        </div>
      )}

      {/* See all link */}
      {cars.length > 0 && (
        <div className="mt-8 text-center">
          <Link
            href={carsHref}
            className="text-sm font-bold transition-opacity hover:opacity-70"
            style={{ color: 'var(--copper)' }}
          >
            {t.seeAll}
          </Link>
        </div>
      )}
    </section>
  )
}
