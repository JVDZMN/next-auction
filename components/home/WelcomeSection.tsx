'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useDict } from '@/lib/i18n/context'
import { useInView } from '@/lib/use-in-view'

interface Props { locale: string; showcaseImage: string | null }

export function WelcomeSection({ locale, showcaseImage }: Props) {
  const t = useDict().home.welcome
  const [textRef,  textInView]  = useInView<HTMLDivElement>({ rootMargin: '-80px' })
  const [imageRef, imageInView] = useInView<HTMLDivElement>({ rootMargin: '-80px' })

  return (
    <section className="min-h-screen flex flex-col justify-center py-16 sm:py-20" style={{ backgroundColor: 'var(--page-bg)' }}>
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 sm:px-10 md:grid-cols-2 lg:gap-24">

        <div
          ref={textRef}
          className={`transition-all duration-700 ${textInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>
            {t.label}
          </p>
          <h2 className="mb-5 text-4xl font-black leading-tight sm:text-5xl" style={{ color: 'var(--text-body)' }}>
            {t.heading}
          </h2>
          <p className="mb-8 text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {t.body}
          </p>
          <Link
            href={`/${locale}/cars`}
            className="inline-flex items-center gap-2 rounded px-7 py-3.5 text-sm font-bold text-white hover:scale-105 active:scale-95 transition-transform duration-150"
            style={{ backgroundColor: 'var(--copper)' }}
          >
            {t.cta}
            <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
              <path d="M3 7.5h9M8 3l4.5 4.5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div
          ref={imageRef}
          className={`relative transition-all duration-700 delay-100 ${imageInView ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
        >
          <div className="absolute inset-0 z-0" style={{ border: `5px solid ${'var(--copper)'}`, transform: 'translate(14px, 14px)' }} />
          <div className="relative z-10 overflow-hidden" style={{ aspectRatio: '4/3', backgroundColor: 'var(--brand)' }}>
            {showcaseImage ? (
              <Image src={showcaseImage} alt="Featured vehicle" fill className="object-cover" sizes="(max-width: 768px) 100vw, 45vw" priority />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <CarSilhouetteSVG className="h-24 w-36 text-white/25" />
              </div>
            )}
            <div className="absolute left-0 top-0 h-10 w-10" style={{ backgroundColor: 'var(--copper)' }} />
          </div>
        </div>

      </div>
    </section>
  )
}

function CarSilhouetteSVG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 34 L20 24 L38 18 L60 16 L82 18 L98 24 L104 30 L108 34 L100 34 Q97 26 88 26 Q79 26 76 34 L44 34 Q41 26 32 26 Q23 26 20 34 Z" />
      <circle cx="30" cy="34" r="8" /><circle cx="90" cy="34" r="8" />
    </svg>
  )
}
