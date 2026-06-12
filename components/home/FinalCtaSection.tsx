'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useDict } from '@/lib/i18n/context'
import { CornerAccent } from './CornerAccent'

interface Props { locale: string }

export function FinalCtaSection({ locale }: Props) {
  const t = useDict().home.finalCta
  const sectionRef = useRef<HTMLDivElement>(null)

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
    <section className="relative py-24 sm:py-32" style={{ backgroundColor: 'var(--dark-section)' }}>
      <CornerAccent position="bottom-left" color="silver" />
      <div ref={sectionRef} className="relative z-10 mx-auto max-w-2xl px-6 text-center">
        <h2
          className="reveal mb-4 font-black text-white leading-tight"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.02em' }}
        >
          {t.heading}
        </h2>
        <p className="reveal delay-1 mb-10 text-lg" style={{ color: 'rgba(255,255,255,0.60)' }}>
          {t.subtext}
        </p>
        <div className="reveal delay-2 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/${locale}/auth/signup`}
            className="inline-flex items-center justify-center rounded px-8 py-4 text-sm font-bold text-white transition-opacity hover:opacity-85 min-h-11"
            style={{ backgroundColor: 'var(--copper)' }}
          >
            {t.btnSignUp}
          </Link>
          <Link
            href={`/${locale}/cars`}
            className="inline-flex items-center justify-center rounded border-2 px-8 py-4 text-sm font-bold text-white transition-opacity hover:opacity-70 min-h-11"
            style={{ borderColor: 'rgba(255,255,255,0.35)' }}
          >
            {t.btnBrowse}
          </Link>
        </div>
      </div>
    </section>
  )
}
