'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useInView } from '@/lib/use-in-view'
import { cloudinaryBlurUrl } from '@/lib/cloudinary'
import { useDict } from '@/lib/i18n/context'

export interface AuctionCar {
  id: string
  year: number
  brand: string
  model: string
  subModel: string | null
  images: string[]
  currentPrice: number
  auctionEndDate: string
  bidCount: number
  ownerUserType: 'PRIVATE' | 'BUSINESS'
}

function timeLeft(iso: string, endedLabel: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return endedLabel
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function MiniCard({
  car,
  locale,
  labels,
}: {
  car: AuctionCar
  locale: string
  labels: {
    ended: string
    business: string
    private: string
    currentBid: string
    endsIn: string
  }
}) {
  const isBusiness = car.ownerUserType === 'BUSINESS'

  return (
    <Link
      href={`/${locale}/cars/${car.id}`}
      className="group block overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative" style={{ aspectRatio: '16/10', backgroundColor: 'var(--section-alt)' }}>
        {car.images[0] ? (
          <Image
            src={car.images[0]}
            alt={`${car.year} ${car.brand} ${car.model}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 33vw"
            placeholder="blur"
            blurDataURL={cloudinaryBlurUrl(car.images[0])}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-10 w-14 text-slate-300" viewBox="0 0 120 48" fill="currentColor">
              <path d="M14 34 L20 24 L38 18 L60 16 L82 18 L98 24 L104 30 L108 34 L100 34 Q97 26 88 26 Q79 26 76 34 L44 34 Q41 26 32 26 Q23 26 20 34 Z" />
              <circle cx="30" cy="34" r="8" /><circle cx="90" cy="34" r="8" />
            </svg>
          </div>
        )}
        <span
          className="absolute bottom-2 right-2 rounded px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: isBusiness ? 'var(--dark-section)' : 'var(--copper)' }}
        >
          {isBusiness ? `🏢 ${labels.business}` : `🏠 ${labels.private}`}
        </span>
      </div>

      <div className="p-4">
        <p className="truncate text-sm font-black" style={{ color: 'var(--text-body)' }}>
          {car.year} {car.brand} {car.model}
        </p>
        {car.subModel && (
          <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--text-muted)' }}>{car.subModel}</p>
        )}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{labels.currentBid}</p>
            <p className="text-sm font-bold" style={{ color: 'var(--copper)' }}>
              {car.currentPrice.toLocaleString(locale === 'da' ? 'da-DK' : 'en-US')} kr
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{labels.endsIn}</p>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {timeLeft(car.auctionEndDate, labels.ended)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

interface Props {
  locale: string
  label: string
  heading: string
  subtext: string
  cars: AuctionCar[]
  viewAllHref: string
  dark?: boolean
}

export function AuctionTypeSection({ locale, label, heading, subtext, cars, viewAllHref, dark }: Props) {
  const cards = useDict().home.auctionCards
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: '-60px' })

  if (cars.length === 0) return null

  const cardLabels = {
    ended: cards.ended,
    business: cards.business,
    private: cards.private,
    currentBid: cards.currentBid,
    endsIn: cards.endsIn,
  }

  return (
    <section
      className="py-20 sm:py-28"
      style={{ backgroundColor: dark ? 'var(--dark-section)' : 'var(--page-bg)' }}
    >
      <div
        ref={ref}
        className="mx-auto max-w-6xl px-6 sm:px-10"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>
              {label}
            </p>
            <h2 className="text-3xl font-black sm:text-4xl" style={{ color: dark ? 'var(--text-light)' : 'var(--text-body)' }}>
              {heading}
            </h2>
            <p className="mt-2 text-sm" style={{ color: dark ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>
              {subtext}
            </p>
          </div>
          <Link
            href={viewAllHref}
            className="hidden text-sm font-bold sm:block hover:opacity-70 transition-opacity"
            style={{ color: 'var(--copper)' }}
          >
            {cards.viewAll}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cars.map(car => (
            <MiniCard key={car.id} car={car} locale={locale} labels={cardLabels} />
          ))}
        </div>

        <div className="mt-8 sm:hidden text-center">
          <Link
            href={viewAllHref}
            className="text-sm font-bold hover:opacity-70 transition-opacity"
            style={{ color: 'var(--copper)' }}
          >
            {cards.viewAllMobile}
          </Link>
        </div>
      </div>
    </section>
  )
}
