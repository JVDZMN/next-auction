'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { useDict } from '@/lib/i18n/context'

interface Props { locale: string; isSignedIn: boolean; role?: string }

export function HeroSection({ locale, isSignedIn, role }: Props) {
  const isBusiness = role === 'BUSINESS_USER'
  const t = useDict().home.hero
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll('.fade-in-up')
    if (!els) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 },
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const trustItems = [t.trustItem1, t.trustItem2, t.trustItem3]

  return (
    <section style={{ backgroundColor: 'var(--page-bg)' }} className="relative overflow-hidden">
      <div ref={sectionRef} className="mx-auto max-w-7xl px-4 sm:px-10 pt-20 pb-10 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24">
        <div className="grid grid-cols-2 gap-4 sm:gap-10 lg:gap-16 items-center">

        {/* Left — content */}
        <div>

          {/* Label with lines — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-3 mb-8">
            <span className="h-px w-10 shrink-0" style={{ backgroundColor: 'var(--copper)' }} />
            <p className="text-xs font-bold uppercase tracking-[0.25em] whitespace-nowrap" style={{ color: 'var(--copper)' }}>
              {isBusiness ? t.labelBusiness : t.labelPrivate}
            </p>
            <span className="h-px w-10 shrink-0" style={{ backgroundColor: 'var(--copper)' }} />
          </div>

          {/* Heading */}
          <h1
            className="font-black leading-none mb-3 sm:mb-6"
            style={{
              fontSize: 'clamp(1.4rem, 7vw, 7rem)',
              letterSpacing: '-0.02em',
              color: 'var(--text-body)',
            }}
          >
            {isBusiness ? (
              <>
                <span className="hero-text-1 block">{t.headingBusinessLine1}</span>
                <span className="hero-text-2 block">{t.headingBusinessLine2}</span>
                <span className="hero-text-3 block" style={{ color: 'var(--copper)' }}>{t.headingBusinessLine3}</span>
              </>
            ) : (
              <>
                <span className="hero-text-1 block">{t.headingPrivateLine1.split(' ')[0]}</span>
                <span className="hero-text-2 block">
                  <span className="text-outline">
                    {t.headingPrivateLine1.split(' ')[1]}
                  </span>
                </span>
                <span className="hero-text-3 block copper-shimmer">{t.headingPrivateLine2}</span>
              </>
            )}
          </h1>

          {/* Subtext — hidden on mobile */}
          <p
            className="hero-subtext hidden sm:block mb-8 text-base sm:text-lg leading-relaxed max-w-md"
            style={{ color: 'var(--text-muted)' }}
          >
            {t.subtextLine1}<br />
            {t.subtextLine2}
          </p>

          {/* Buttons */}
          <div className="hero-buttons flex flex-col gap-2 mb-4 sm:mb-10">
            <Link
              href={isBusiness ? `/${locale}/dealers` : `/${locale}/cars`}
              className="inline-flex items-center justify-center rounded px-3 sm:px-7 py-2 sm:py-4 text-xs sm:text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--copper)' }}
            >
              {isBusiness ? t.btnFindBusiness : t.btnFindPrivate}
            </Link>
            <Link
              href={isSignedIn ? `/${locale}/cars/create` : `/${locale}/auth/signup`}
              className="inline-flex items-center justify-center rounded border-2 px-3 sm:px-7 py-2 sm:py-4 text-xs sm:text-sm font-bold transition-opacity hover:opacity-70"
              style={{ borderColor: 'var(--text-body)', color: 'var(--text-body)' }}
            >
              {t.btnSell}
            </Link>
          </div>

          {/* Trust row — hidden on mobile */}
          <div className="hidden sm:flex flex-wrap gap-x-6 gap-y-2">
            {trustItems.map((item, idx) => (
              <div key={idx} className={`flex items-center gap-2 text-sm fade-in-up delay-${idx + 1}`} style={{ color: 'var(--text-muted)' }}>
                <span className="font-black text-base" style={{ color: 'var(--copper)' }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right — hero image */}
        <div className="hero-image float-animation">
          <Image
            src="/images/heroimage.png"
            alt={t.imageAlt}
            width={600}
            height={500}
            style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
            priority
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
