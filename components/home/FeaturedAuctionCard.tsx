'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { cloudinaryBlurUrl } from '@/lib/cloudinary'
import { CarCardLivePrice } from '@/components/CarCardLivePrice'
import { useDict, useLocale } from '@/lib/i18n/context'
import type { AuctionRow } from '@/lib/auction-queries'

function useTimeLeft(isoDate: string, endedLabel: string) {
  const [label, setLabel] = useState('')
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    function compute() {
      const ms = new Date(isoDate).getTime() - Date.now()
      if (ms <= 0) { setLabel(endedLabel); setUrgent(false); return }
      const d = Math.floor(ms / 86_400_000)
      const h = Math.floor((ms % 86_400_000) / 3_600_000)
      const m = Math.floor((ms % 3_600_000) / 60_000)
      setUrgent(d === 0)
      if (d > 0) setLabel(`${d}d ${h}h`)
      else if (h > 0) setLabel(`${h}h ${m}m`)
      else setLabel(`${m}m`)
    }
    compute()
    const id = setInterval(compute, 30_000)
    return () => clearInterval(id)
  }, [isoDate, endedLabel])

  return { label, urgent }
}

interface Props {
  car: AuctionRow
}

export function FeaturedAuctionCard({ car }: Props) {
  const locale = useLocale()
  const t = useDict().home.marketplace
  const { label: timeLabel, urgent } = useTimeLeft(car.auctionEndDate, t.ended)
  const isNoReserve = car.reservePrice === null || car.reservePrice === undefined

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-px w-6 shrink-0" style={{ backgroundColor: 'var(--copper)' }} />
        <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--copper)' }}>
          {t.featuredLabel}
        </p>
      </div>

      <Link href={`/${locale}/cars/${car.id}`} className="block group">
        <div
          className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Image */}
            <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {car.images[0] ? (
                <Image
                  src={car.images[0]}
                  alt={`${car.year} ${car.brand} ${car.model}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  placeholder="blur"
                  blurDataURL={cloudinaryBlurUrl(car.images[0])}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: 'var(--section-alt)' }}>
                  <svg className="h-16 w-24 text-slate-300" viewBox="0 0 120 48" fill="currentColor">
                    <path d="M14 34 L20 24 L38 18 L60 16 L82 18 L98 24 L104 30 L108 34 L100 34 Q97 26 88 26 Q79 26 76 34 L44 34 Q41 26 32 26 Q23 26 20 34 Z" />
                    <circle cx="30" cy="34" r="8" /><circle cx="90" cy="34" r="8" />
                  </svg>
                </div>
              )}

              {/* Time badge */}
              <div
                className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: urgent ? '#dc2626' : 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.endsIn} {timeLabel}
              </div>

              {/* No reserve badge */}
              {isNoReserve && (
                <div
                  className="absolute top-3 right-3 rounded-md px-2.5 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: 'var(--copper)' }}
                >
                  {t.noReserve}
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className="flex flex-col justify-between p-6 lg:p-8">
              <div>
                <h2
                  className="text-2xl lg:text-3xl font-black leading-tight mb-1"
                  style={{ color: 'var(--text-body)', letterSpacing: '-0.01em' }}
                >
                  {car.year} {car.brand} {car.model}
                  {car.subModel && <span className="text-lg font-semibold ml-1" style={{ color: 'var(--text-muted)' }}>{car.subModel}</span>}
                </h2>

                <div className="flex flex-wrap gap-2 mt-3 mb-6">
                  {car.fuel && (
                    <span className="rounded-md px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: 'var(--section-alt)', color: 'var(--text-muted)' }}>
                      {car.fuel}
                    </span>
                  )}
                  {car.bodyType && (
                    <span className="rounded-md px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: 'var(--section-alt)', color: 'var(--text-muted)' }}>
                      {car.bodyType}
                    </span>
                  )}
                  {car.km != null && (
                    <span className="rounded-md px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: 'var(--section-alt)', color: 'var(--text-muted)' }}>
                      {car.km.toLocaleString('da-DK')} km
                    </span>
                  )}
                  {car.city && (
                    <span className="rounded-md px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: 'var(--section-alt)', color: 'var(--text-muted)' }}>
                      {car.city}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t pt-5" style={{ borderColor: 'var(--border)' }}>
                <CarCardLivePrice
                  carId={car.id}
                  initialPrice={car.currentPrice}
                  initialBidCount={car.bidCount}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </section>
  )
}
