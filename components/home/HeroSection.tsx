'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useDict } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

interface Props { locale: string; isSignedIn: boolean; userType?: 'PRIVATE' | 'BUSINESS' }

export function HeroSection({ locale, isSignedIn, userType }: Props) {
  const dict       = useDict()
  const nav        = dict.nav
  const isBusiness = userType === 'BUSINESS'

  return (
    <section
      className="relative flex flex-col min-h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--dark-section)' }}
    >
      {/* Diagonal copper overlay — right side */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: 0, top: 0, bottom: 0,
          width: '45%',
          background: 'var(--copper)',
          clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)',
          opacity: 0.12,
          pointerEvents: 'none',
        }}
      />

      {/* Hero image — right half, fills the copper zone */}
      <div
        aria-hidden
        className="absolute right-0 top-0 bottom-0 hidden lg:block"
        style={{ width: '45%', clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)' }}
      >
        <Image
          src="/images/heroimage.png"
          alt=""
          fill
          className="object-cover object-center opacity-30"
          priority
          sizes="45vw"
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-12">
        <Link
          href={`/${locale}`}
          className="select-none text-xl font-black tracking-tight hover:scale-105 transition-transform duration-150 inline-block"
          style={{ color: 'var(--text-light)' }}
        >
          Next<span style={{ color: 'var(--copper)' }}>Auction</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href={`/${locale}/cars`} className="hidden text-sm font-medium transition-colors hover:opacity-70 sm:block" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {nav.browse}
          </Link>
          <Link href={isSignedIn ? `/${locale}/dashboard` : `/${locale}/auth/signin`} className="hidden text-sm font-medium transition-colors hover:opacity-70 sm:block" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {isSignedIn ? nav.dashboard : nav.signIn}
          </Link>
          <LanguageSwitcher />
          <Link
            href={isSignedIn ? `/${locale}/cars/create` : `/${locale}/auth/signup`}
            className="rounded px-4 py-2 text-sm font-bold text-white hover:scale-105 active:scale-95 transition-transform duration-150 inline-block shadow-sm"
            style={{ backgroundColor: 'var(--copper)' }}
          >
            {isSignedIn ? 'Opret bil' : 'Opret konto'}
          </Link>
        </div>
      </nav>

      {/* Hero content — left-aligned */}
      <div className="relative z-10 flex flex-1 items-center px-6 sm:px-12 lg:px-20 py-20">
        <div className="max-w-xl">
          {/* Label */}
          <p
            className="mb-5 text-xs font-bold uppercase tracking-[0.25em]"
            style={{ color: 'var(--copper)' }}
          >
            {isBusiness ? 'Erhvervsauktioner · B2B Markedsplads' : 'Danmarks Bilauktionsplatform'}
          </p>

          {/* Heading */}
          <h1
            className="font-black text-white leading-none mb-6"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
          >
            {isBusiness ? <>Find<br />Forhandler.<br />Handel.</> : <>Bid.<br />Vind.<br />Kør.</>}
          </h1>

          {/* Subtext */}
          <p
            className="mb-10 text-base sm:text-lg leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.68)' }}
          >
            {isBusiness
              ? 'Erhvervsauktioner · Godkendte forhandlere · Professionel handel'
              : 'Real-time auktioner · Verificerede sælgere · Sikker handel'}
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4">
            <Link
              href={isBusiness ? `/${locale}/dealers` : `/${locale}/cars`}
              className="inline-block rounded px-7 py-4 text-sm font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150"
              style={{ backgroundColor: 'var(--copper)' }}
            >
              {isBusiness ? 'Find forhandler →' : 'Find din næste bil →'}
            </Link>
            <Link
              href={isSignedIn ? `/${locale}/cars/create` : `/${locale}/auth/signup`}
              className="inline-block rounded border-2 px-7 py-4 text-sm font-bold transition-all duration-150 hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}
            >
              {isBusiness ? 'Opret erhvervsannonce' : 'Sælg din bil'}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--dark-section))' }}
      />
    </section>
  )
}
