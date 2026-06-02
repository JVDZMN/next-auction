'use client'

import Link from 'next/link'
import { useInView } from '@/lib/use-in-view'

interface Props { locale: string }

export function FinalCtaSection({ locale }: Props) {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: '-60px' })

  return (
    <section
      className="relative overflow-hidden py-24 sm:py-32"
      style={{
        background: 'linear-gradient(135deg, var(--copper) 0%, #a0622a 100%)',
      }}
    >
      {/* Diagonal accent overlay */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: 0, top: 0, bottom: 0,
          width: '40%',
          background: 'rgba(0,0,0,0.15)',
          clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        ref={ref}
        className="relative z-10 mx-auto max-w-2xl px-6 text-center"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <h2 className="mb-3 text-4xl font-black text-white sm:text-5xl leading-tight">
          Klar til at komme i gang?
        </h2>
        <p className="mb-10 text-lg text-white/80">
          Opret din gratis konto i dag
        </p>
        <Link
          href={`/${locale}/auth/signup`}
          className="inline-block rounded px-9 py-4 text-base font-bold hover:scale-105 active:scale-95 transition-transform duration-150 shadow-xl"
          style={{ backgroundColor: 'var(--dark-section)', color: 'white' }}
        >
          Kom i gang nu →
        </Link>
      </div>
    </section>
  )
}
