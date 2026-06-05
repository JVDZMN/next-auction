'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useDict } from '@/lib/i18n/context'

interface Props { locale: string }

export function SellerTypeSection({ locale }: Props) {
  const t = useDict().home.sellerTypes
  const sectionRef = useRef<HTMLDivElement>(null)

  const privateFeatures = [t.privateFeature1, t.privateFeature2, t.privateFeature3]
  const businessFeatures = [t.businessFeature1, t.businessFeature2, t.businessFeature3]

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll('.fade-in-up')
    if (!els) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="py-20 sm:py-28" style={{ backgroundColor: 'var(--card-bg)' }}>
      <div ref={sectionRef} className="mx-auto max-w-6xl px-6 sm:px-10">

        <div className="mb-14 text-center fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-10" style={{ backgroundColor: 'var(--copper)' }} />
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>
              {t.label}
            </p>
            <span className="h-px w-10" style={{ backgroundColor: 'var(--copper)' }} />
          </div>
          <h2 className="text-3xl font-black sm:text-4xl" style={{ color: 'var(--text-body)', letterSpacing: '-0.01em' }}>
            {t.heading}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div
            className="fade-in-up rounded-2xl p-10 flex flex-col"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--copper)',
            }}
          >
            <span className="mb-4 text-5xl font-black leading-none" style={{ color: 'var(--copper)' }}>01</span>
            <h3 className="mb-1 text-2xl font-black" style={{ color: 'var(--text-body)' }}>{t.privateTitle}</h3>
            <p className="mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>{t.privateDesc}</p>
            <ul className="mb-10 flex flex-col gap-3 flex-1">
              {privateFeatures.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm font-medium" style={{ color: 'var(--text-body)' }}>
                  <span className="font-black" style={{ color: 'var(--copper)' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={`/${locale}/auth/signup?tab=private`}
              className="inline-flex items-center justify-center rounded px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-85 min-h-11"
              style={{ backgroundColor: 'var(--copper)' }}
            >
              {t.privateCta}
            </Link>
          </div>

          <div
            className="fade-in-up delay-1 rounded-2xl p-10 flex flex-col"
            style={{ backgroundColor: 'var(--dark-section)' }}
          >
            <span className="mb-4 text-5xl font-black leading-none" style={{ color: 'var(--copper)' }}>02</span>
            <h3 className="mb-1 text-2xl font-black" style={{ color: 'var(--text-light)' }}>{t.businessTitle}</h3>
            <p className="mb-8 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{t.businessDesc}</p>
            <ul className="mb-10 flex flex-col gap-3 flex-1">
              {businessFeatures.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <span className="font-black" style={{ color: 'var(--copper)' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={`/${locale}/auth/signup?tab=business`}
              className="inline-flex items-center justify-center rounded border-2 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-80 min-h-11"
              style={{ borderColor: 'rgba(255,255,255,0.3)' }}
            >
              {t.businessCta}
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
