'use client'

import Link from 'next/link'

interface Props { locale: string; isSignedIn: boolean; userType?: 'PRIVATE' | 'BUSINESS' }

const TRUST_ITEMS = [
  'Gratis at oprette konto',
  'Juridisk bindende bud',
  'Direkte handel',
]

export function HeroSection({ locale, isSignedIn, userType }: Props) {
  const isBusiness = userType === 'BUSINESS'

  return (
    <section style={{ backgroundColor: 'var(--page-bg)' }} className="overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

        {/* Left — content */}
        <div>

          {/* Label with lines */}
          <div className="flex items-center gap-3 mb-8">
            <span className="h-px w-10 shrink-0" style={{ backgroundColor: 'var(--copper)' }} />
            <p className="text-xs font-bold uppercase tracking-[0.25em] whitespace-nowrap" style={{ color: 'var(--copper)' }}>
              {isBusiness ? 'Erhvervsauktionsplatform' : 'Danmarks Bilauktionsplatform'}
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
                Find<br />
                Forhandler.<br />
                <span style={{ color: 'var(--copper)' }}>Handel.</span>
              </>
            ) : (
              <>
                Bid. Vind.<br />
                <span style={{ color: 'var(--copper)' }}>Kør.</span>
              </>
            )}
          </h1>

          {/* Subtext */}
          <p
            className="mb-8 text-base sm:text-lg leading-relaxed max-w-md"
            style={{ color: 'var(--text-muted)' }}
          >
            Real-time auktioner · Direkte handel<br />
            mellem køber og sælger
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link
              href={isBusiness ? `/${locale}/dealers` : `/${locale}/cars`}
              className="inline-flex items-center justify-center rounded px-7 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90 min-h-11"
              style={{ backgroundColor: 'var(--copper)' }}
            >
              {isBusiness ? 'Find forhandler →' : 'Find din næste bil →'}
            </Link>
            <Link
              href={isSignedIn ? `/${locale}/cars/create` : `/${locale}/auth/signup`}
              className="inline-flex items-center justify-center rounded border-2 px-7 py-4 text-sm font-bold transition-opacity hover:opacity-70 min-h-11"
              style={{ borderColor: 'var(--text-body)', color: 'var(--text-body)' }}
            >
              Sælg din bil
            </Link>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {TRUST_ITEMS.map(item => (
              <div key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
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
            alt="Next Auction bilauktion"
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
    </section>
  )
}
