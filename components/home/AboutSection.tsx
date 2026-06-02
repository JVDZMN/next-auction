'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useInView } from '@/lib/use-in-view'
import type { AuctionCar } from './AuctionTypeSection'

interface Props {
  locale: string
  topCars: AuctionCar[]
}

const CHECK_ITEMS = [
  'Afgiv bud i realtid fra hvor som helst',
  'Sæt din reservepris — sælg kun til den rigtige pris',
  'Direkte kontakt mellem køber og sælger',
]

export function AboutSection({ locale, topCars }: Props) {
  const [textRef, textInView]   = useInView<HTMLDivElement>({ rootMargin: '-80px' })
  const [imageRef, imageInView] = useInView<HTMLDivElement>({ rootMargin: '-80px' })

  const carImages = topCars
    .flatMap(c => c.images)
    .filter(Boolean)
    .slice(0, 4)

  return (
    <section className="py-20 sm:py-28" style={{ backgroundColor: 'var(--page-bg)' }}>
      <div className="mx-auto max-w-6xl px-6 sm:px-10 grid grid-cols-1 md:grid-cols-2 gap-14 lg:gap-24 items-center">

        {/* Left — text */}
        <div
          ref={textRef}
          style={{
            opacity: textInView ? 1 : 0,
            transform: textInView ? 'translateX(0)' : 'translateX(-32px)',
            transition: 'opacity 0.65s ease, transform 0.65s ease',
          }}
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>
            Om Next Auction
          </p>
          <h2 className="mb-5 text-4xl font-black leading-tight sm:text-5xl" style={{ color: 'var(--text-body)' }}>
            Den smarteste måde at handle bil på
          </h2>
          <p className="mb-8 text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Next Auction er en moderne platform der forbinder bilkøbere og sælgere
            gennem transparent, real-time auktionsformat.
          </p>

          <ul className="mb-10 flex flex-col gap-4">
            {CHECK_ITEMS.map(item => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-0.5 shrink-0 text-base font-black"
                  style={{ color: 'var(--copper)' }}
                >
                  ✓
                </span>
                <span className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <Link
            href={`/${locale}/cars`}
            className="inline-block rounded px-7 py-3.5 text-sm font-bold text-white hover:scale-105 active:scale-95 transition-transform duration-150"
            style={{ backgroundColor: 'var(--copper)' }}
          >
            Læs mere om os →
          </Link>
        </div>

        {/* Right — 2×2 image grid */}
        <div
          ref={imageRef}
          className="grid grid-cols-2 gap-3"
          style={{
            opacity: imageInView ? 1 : 0,
            transform: imageInView ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.65s ease 0.1s, transform 0.65s ease 0.1s',
          }}
        >
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="relative overflow-hidden rounded-lg"
              style={{
                aspectRatio: '4/3',
                backgroundColor: 'var(--dark-section)',
                outline: i === 0 ? `2px solid var(--copper)` : 'none',
                outlineOffset: i === 0 ? '3px' : '0',
              }}
            >
              {carImages[i] ? (
                <Image
                  src={carImages[i]}
                  alt="Auktionsbil"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <svg className="h-10 w-14 text-white/20" viewBox="0 0 120 48" fill="currentColor">
                    <path d="M14 34 L20 24 L38 18 L60 16 L82 18 L98 24 L104 30 L108 34 L100 34 Q97 26 88 26 Q79 26 76 34 L44 34 Q41 26 32 26 Q23 26 20 34 Z" />
                    <circle cx="30" cy="34" r="8" />
                    <circle cx="90" cy="34" r="8" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
