'use client'

import Link from 'next/link'
import { User, Building2 } from 'lucide-react'
import { useInView } from '@/lib/use-in-view'

const PRIVATE_FEATURES = ['Helt gratis', 'Enkel opsætning', 'Bred eksponering']
const BUSINESS_FEATURES = ['Ubegrænset antal biler', 'Prioriteret placering', 'Erhvervsprofil']

interface Props { locale: string }

export function SellerTypeSection({ locale }: Props) {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: '-60px' })

  return (
    <section className="py-20 sm:py-28" style={{ backgroundColor: 'var(--section-alt)' }}>
      <div
        ref={ref}
        className="mx-auto max-w-5xl px-6 sm:px-10 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden rounded-2xl shadow-2xl"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        {/* Left — Private, copper background */}
        <div
          className="relative flex flex-col p-10 overflow-hidden"
          style={{ backgroundColor: 'var(--copper)' }}
        >
          {/* Diagonal accent */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: 0, top: 0, bottom: 0,
              width: '40%',
              background: 'rgba(0,0,0,0.12)',
              clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)',
              pointerEvents: 'none',
            }}
          />

          <div className="relative z-10">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <User className="h-6 w-6 text-white" strokeWidth={1.6} />
            </div>
            <h3 className="mb-1 text-2xl font-black text-white">Privat Sælger</h3>
            <p className="mb-7 text-sm text-white/75">Sælg op til 2 biler om året</p>

            <ul className="mb-10 flex flex-col gap-3">
              {PRIVATE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm font-medium text-white">
                  <span className="font-black">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={`/${locale}/auth/signup`}
              className="inline-block rounded px-6 py-3 text-sm font-bold transition-all duration-150 hover:scale-105 active:scale-95"
              style={{ backgroundColor: 'var(--dark-section)', color: 'white' }}
            >
              Opret Privatkonto
            </Link>
          </div>
        </div>

        {/* Right — Business, dark navy */}
        <div
          className="relative flex flex-col p-10 overflow-hidden"
          style={{ backgroundColor: 'var(--dark-section)' }}
        >
          {/* Diagonal accent */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: 0, top: 0, bottom: 0,
              width: '40%',
              background: 'var(--copper)',
              clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)',
              opacity: 0.08,
              pointerEvents: 'none',
            }}
          />

          <div className="relative z-10">
            <div
              className="mb-5 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(196,125,58,0.15)', border: '1.5px solid var(--copper)' }}
            >
              <Building2 className="h-6 w-6" style={{ color: 'var(--copper)' }} strokeWidth={1.6} />
            </div>
            <h3 className="mb-1 text-2xl font-black" style={{ color: 'var(--text-light)' }}>Erhvervssælger</h3>
            <p className="mb-7 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Professionelt salg med CVR</p>

            <ul className="mb-10 flex flex-col gap-3">
              {BUSINESS_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <span className="font-black" style={{ color: 'var(--copper)' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={`/${locale}/auth/signup?type=business`}
              className="inline-block rounded px-6 py-3 text-sm font-bold text-white hover:scale-105 active:scale-95 transition-transform duration-150"
              style={{ backgroundColor: 'var(--copper)' }}
            >
              Ansøg om Erhvervskonto
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
