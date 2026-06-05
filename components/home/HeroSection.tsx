'use client'

import Link from 'next/link'
import { useDict } from '@/lib/i18n/context'

interface Props { locale: string; isSignedIn: boolean; userType?: 'PRIVATE' | 'BUSINESS' }

export function HeroSection({ locale, isSignedIn, userType }: Props) {
  const isBusiness = userType === 'BUSINESS'
  const t = useDict().home.hero

  const trustItems = [t.trustItem1, t.trustItem2, t.trustItem3]

  return (
    <section style={{ backgroundColor: 'var(--page-bg)' }} className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24">
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

        {/* Left — content */}
        <div>

          {/* Label with lines */}
          <div className="flex items-center gap-3 mb-8">
            <span className="h-px w-10 shrink-0" style={{ backgroundColor: 'var(--copper)' }} />
            <p className="text-xs font-bold uppercase tracking-[0.25em] whitespace-nowrap" style={{ color: 'var(--copper)' }}>
              {isBusiness ? t.labelBusiness : t.labelPrivate}
            </p>
            <span className="h-px w-10 shrink-0" style={{ backgroundColor: 'var(--copper)' }} />
          </div>

          {/* Heading — no animation on LCP element */}
          <h1
            className="font-black leading-none mb-6"
            style={{
              fontSize: 'clamp(3.5rem, 8vw, 7rem)',
              letterSpacing: '-0.02em',
              color: 'var(--text-body)',
            }}
          >
            {isBusiness ? (
              <>
                {t.headingBusinessLine1}<br />
                {t.headingBusinessLine2}<br />
                <span style={{ color: 'var(--copper)' }}>{t.headingBusinessLine3}</span>
              </>
            ) : (
              <>
                {t.headingPrivateLine1}<br />
                <span style={{ color: 'var(--copper)' }}>{t.headingPrivateLine2}</span>
              </>
            )}
          </h1>

          {/* Subtext */}
          <p
            className="mb-8 text-base sm:text-lg leading-relaxed max-w-md"
            style={{ color: 'var(--text-muted)' }}
          >
            {t.subtextLine1}<br />
            {t.subtextLine2}
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link
              href={isBusiness ? `/${locale}/dealers` : `/${locale}/cars`}
              className="inline-flex items-center justify-center rounded px-7 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90 min-h-11"
              style={{ backgroundColor: 'var(--copper)' }}
            >
              {isBusiness ? t.btnFindBusiness : t.btnFindPrivate}
            </Link>
            <Link
              href={isSignedIn ? `/${locale}/cars/create` : `/${locale}/auth/signup`}
              className="inline-flex items-center justify-center rounded border-2 px-7 py-4 text-sm font-bold transition-opacity hover:opacity-70 min-h-11"
              style={{ borderColor: 'var(--text-body)', color: 'var(--text-body)' }}
            >
              {t.btnSell}
            </Link>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {trustItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <span className="font-black text-base" style={{ color: 'var(--copper)' }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right — hero image */}
        <div>
          <img
            src="/images/heroimage.png"
            alt={t.imageAlt}
            style={{
              width: '100%',
              maxHeight: '500px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        </div>{/* end grid */}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 hidden md:flex">
        <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--copper)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
