'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useDict } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

interface Props { locale: string; isSignedIn: boolean }

export function HeroSection({ locale, isSignedIn }: Props) {
  const dict    = useDict()
  const t       = dict.home.hero
  const nav     = dict.nav
  const phrases = [t.phrase1, t.phrase2, t.phrase3]

  const [idx, setIdx] = useState(0)
  const done = idx === phrases.length - 1

  useEffect(() => {
    if (idx >= phrases.length - 1) return
    const timer = setTimeout(() => setIdx(i => i + 1), 1500)
    return () => clearTimeout(timer)
  }, [idx, phrases.length])

  return (
    <section className="relative flex h-screen flex-col overflow-hidden">
      <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" aria-hidden>
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, var(--dark-section) 0%, rgba(18,37,53,0.72) 55%, var(--dark-section) 100%)', opacity: 0.88 }} />
      <div className="absolute inset-0 bg-black/35" />

      <nav className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-12">
        <Link
          href={`/${locale}`}
          className="select-none text-xl font-black text-white tracking-tight hover:scale-105 transition-transform duration-150 inline-block"
        >
          Next<span style={{ color: 'var(--copper)' }}>Auction</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href={`/${locale}/cars`} className="hidden text-sm font-medium text-white/70 transition-colors hover:text-white sm:block">
            {nav.browse}
          </Link>
          <Link href={isSignedIn ? `/${locale}/dashboard` : `/${locale}/auth/signin`} className="hidden text-sm font-medium text-white/70 transition-colors hover:text-white sm:block">
            {isSignedIn ? nav.dashboard : nav.signIn}
          </Link>
          <LanguageSwitcher />
          <Link
            href={isSignedIn ? `/${locale}/cars/create` : `/${locale}/auth/signup`}
            className="rounded px-4 py-2 text-sm font-bold text-white hover:scale-105 active:scale-95 transition-transform duration-150 inline-block"
            style={{ backgroundColor: 'var(--copper)' }}
          >
            {isSignedIn ? t.listCar : t.phrase1}
          </Link>
        </div>
      </nav>

      <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="overflow-hidden" style={{ height: 'clamp(56px, 10vw, 100px)' }}>
          <h1
            className="font-black leading-none text-white"
            style={{ fontSize: 'clamp(2rem, 7vw, 5.5rem)', textShadow: '0 2px 24px rgba(0,0,0,0.5)' }}
          >
            {phrases[idx]}
          </h1>
        </div>

        <p
          className={`mt-5 text-base text-white/65 sm:text-lg transition-all duration-500 ${done ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          {t.subtitle}
        </p>

        <div
          className={`mt-8 flex gap-4 transition-all duration-500 delay-200 ${done ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          <Link
            href={`/${locale}/cars`}
            className="rounded px-7 py-3.5 text-sm font-bold text-white hover:scale-105 active:scale-95 transition-transform duration-150 inline-block"
            style={{ backgroundColor: 'var(--copper)' }}
          >
            {t.browse}
          </Link>
          <Link
            href={isSignedIn ? `/${locale}/cars/create` : `/${locale}/auth/signup`}
            className="rounded border px-7 py-3.5 text-sm font-bold text-white hover:scale-105 active:scale-95 transition-transform duration-150 inline-block"
            style={{ borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            {t.sell}
          </Link>
        </div>
      </div>

      <div
        className={`relative z-20 flex justify-center pb-7 transition-opacity duration-700 delay-1000 ${done ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex flex-col items-center gap-1 animate-bounce">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Scroll</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white/35">
            <path d="M7 2v10M2 8l5 5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </section>
  )
}
