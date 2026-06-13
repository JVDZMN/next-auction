'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
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

function Slide({ car }: { car: AuctionRow }) {
  const locale = useLocale()
  const t = useDict().home.marketplace
  const { label: timeLabel, urgent } = useTimeLeft(car.auctionEndDate, t.ended)
  const isNoReserve = car.reservePrice === null || car.reservePrice === undefined
  const thumbs = car.images.slice(1, 5)
  const hasThumbs = thumbs.length > 0

  return (
    <Link href={`/${locale}/cars/${car.id}`} className="block group">
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* Main image */}
        <div className="relative overflow-hidden aspect-video lg:aspect-auto lg:min-h-80">
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

          {isNoReserve && (
            <div
              className="absolute top-3 right-3 rounded-md px-2.5 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: 'var(--copper)' }}
            >
              {t.noReserve}
            </div>
          )}
        </div>

        {/* Right panel: thumbnail grid + info */}
        <div className="flex flex-col">
          {hasThumbs && (
            <div
              className={`grid gap-0.5 ${thumbs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              {thumbs.map((src, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden"
                  style={{
                    aspectRatio: '4/3',
                    gridColumn: thumbs.length === 3 && i === 2 ? 'span 2' : undefined,
                  }}
                >
                  <Image
                    src={src}
                    alt={`${car.year} ${car.brand} ${car.model} photo ${i + 2}`}
                    fill
                    className="object-cover group-hover:brightness-95 transition-[filter] duration-300"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    placeholder="blur"
                    blurDataURL={cloudinaryBlurUrl(src)}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col justify-between p-6 lg:p-8 flex-1">
            <div>
              <h2
                className="text-2xl lg:text-3xl font-black leading-tight mb-1"
                style={{ color: 'var(--text-body)', letterSpacing: '-0.01em' }}
              >
                {car.year} {car.brand} {car.model}
                {car.subModel && (
                  <span className="text-lg font-semibold ml-1" style={{ color: 'var(--text-muted)' }}>
                    {car.subModel}
                  </span>
                )}
              </h2>

              <div className="flex flex-wrap gap-2 mt-3 mb-4">
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
  )
}

interface Props {
  cars: AuctionRow[]
}

export function FeaturedAuctionCard({ cars }: Props) {
  const t = useDict().home.marketplace
  const [index, setIndex] = useState(0)

  const prev = useCallback(() => setIndex(i => (i - 1 + cars.length) % cars.length), [cars.length])
  const next = useCallback(() => setIndex(i => (i + 1) % cars.length), [cars.length])

  const showNav = cars.length > 1

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Label + nav controls */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-px w-6 shrink-0" style={{ backgroundColor: 'var(--copper)' }} />
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--copper)' }}>
            {t.featuredLabel}
          </p>
        </div>

        {showNav && (
          <div className="flex items-center gap-2">
            {/* Dot indicators */}
            <div className="hidden sm:flex items-center gap-1 mr-2">
              {cars.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === index ? 20 : 6,
                    height: 6,
                    backgroundColor: i === index ? 'var(--copper)' : 'var(--border)',
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Counter */}
            <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {index + 1} / {cars.length}
            </span>

            {/* Prev / Next */}
            <button
              type="button"
              onClick={prev}
              className="flex items-center justify-center rounded-full w-8 h-8 transition-colors hover:opacity-70"
              style={{ border: '1px solid var(--border)', color: 'var(--text-body)' }}
              aria-label="Previous auction"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              className="flex items-center justify-center rounded-full w-8 h-8 transition-colors hover:opacity-70"
              style={{ border: '1px solid var(--border)', color: 'var(--text-body)' }}
              aria-label="Next auction"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Card */}
      <div
        className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        <Slide car={cars[index]} />
      </div>
    </section>
  )
}
